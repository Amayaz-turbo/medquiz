import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { AdsEligibilityQueryDto } from "./dto/ads-eligibility-query.dto";
import { CreateAdImpressionDto } from "./dto/create-ad-impression.dto";
import { CreateRewardGrantDto } from "./dto/create-reward-grant.dto";

type AdPlacement = "rewarded_end_first_session" | "quiz_start_interstitial" | "rewarded_avatar_cosmetic";
type RewardGrantType = "ad_free_window" | "avatar_cosmetic";

interface OwnedSessionRow {
  id: string;
  is_first_session_of_day: boolean;
  ended_at: string | null;
}

interface ActiveWindowRow {
  id: string;
  trigger_session_id: string;
  ends_at: string;
}

interface AvatarItemRow {
  id: string;
  code: string;
  name: string;
  item_type: "object" | "pose" | "outfit" | "background";
  rarity: string;
  source_type: string;
  required_stage_id: string | null;
  required_stage_code: string | null;
  required_stage_name: string | null;
}

@Injectable()
export class AdsService {
  constructor(private readonly db: DatabaseService) {}

  async getEligibility(userId: string, query: AdsEligibilityQueryDto) {
    const placement = query.placement as AdPlacement;

    const isPremium = await this.isPremiumActive(userId);
    if (isPremium) {
      return {
        placement,
        eligible: false,
        reason: "premium_no_ads",
        rewardWindowEndsAt: null
      };
    }

    if (placement === "quiz_start_interstitial") {
      const activeWindow = await this.getActiveRewardWindow(userId);
      if (activeWindow) {
        return {
          placement,
          eligible: false,
          reason: "ad_free_window_active",
          rewardWindowEndsAt: activeWindow.ends_at
        };
      }
      return {
        placement,
        eligible: true,
        reason: "eligible",
        rewardWindowEndsAt: null
      };
    }

    if (placement === "rewarded_end_first_session") {
      if (!query.sessionId) {
        return {
          placement,
          eligible: false,
          reason: "session_required",
          rewardWindowEndsAt: null
        };
      }

      const session = await this.getOwnedSession(userId, query.sessionId);
      if (!session) {
        return {
          placement,
          eligible: false,
          reason: "session_not_found",
          rewardWindowEndsAt: null
        };
      }
      if (!session.is_first_session_of_day) {
        return {
          placement,
          eligible: false,
          reason: "not_first_session_of_day",
          rewardWindowEndsAt: null
        };
      }
      if (!session.ended_at) {
        return {
          placement,
          eligible: false,
          reason: "session_not_completed",
          rewardWindowEndsAt: null
        };
      }

      const sessionWindow = await this.getRewardWindowForSession(userId, session.id);
      if (sessionWindow && new Date(sessionWindow.ends_at).getTime() > Date.now()) {
        return {
          placement,
          eligible: false,
          reason: "ad_free_window_active",
          rewardWindowEndsAt: sessionWindow.ends_at
        };
      }
      if (sessionWindow) {
        return {
          placement,
          eligible: false,
          reason: "reward_already_granted",
          rewardWindowEndsAt: sessionWindow.ends_at
        };
      }

      return {
        placement,
        eligible: true,
        reason: "eligible",
        rewardWindowEndsAt: null
      };
    }

    await this.ensureAvatarProgress(userId);
    const hasRewardCandidate = await this.hasRewardedAvatarCandidate(userId);
    return {
      placement,
      eligible: hasRewardCandidate,
      reason: hasRewardCandidate ? "eligible" : "no_reward_available",
      rewardWindowEndsAt: null
    };
  }

  async createImpression(userId: string, dto: CreateAdImpressionDto) {
    if (dto.sessionId) {
      const session = await this.getOwnedSession(userId, dto.sessionId);
      if (!session) {
        throw new NotFoundException({
          code: "QUIZ_SESSION_NOT_FOUND",
          message: "Quiz session not found"
        });
      }
    }

    const impression = await this.db.query<{
      id: string;
      placement: AdPlacement;
      shown_at: string;
      reward_granted: boolean;
    }>(
      `
        INSERT INTO ad_impressions
          (id, user_id, session_id, placement, network, reward_granted)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id, placement, shown_at, reward_granted
      `,
      [
        randomUUID(),
        userId,
        dto.sessionId ?? null,
        dto.placement,
        this.normalizeOptionalText(dto.network),
        dto.rewardGranted ?? false
      ]
    );

    const row = impression.rows[0];
    return {
      impressionId: row.id,
      placement: row.placement,
      shownAt: row.shown_at,
      rewardGranted: row.reward_granted
    };
  }

  async createRewardGrant(userId: string, dto: CreateRewardGrantDto) {
    this.assertRewardGrantCombination(dto);

    const isPremium = await this.isPremiumActive(userId);
    if (isPremium) {
      throw new UnprocessableEntityException({
        code: "ADS_NOT_ELIGIBLE",
        message: "Premium users are not eligible for ad reward grants"
      });
    }

    if (dto.grantType === "ad_free_window") {
      return this.grantAdFreeWindow(userId, dto.sessionId as string);
    }
    return this.grantAvatarCosmetic(userId, dto.sessionId ?? null);
  }

  private async grantAdFreeWindow(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (!session) {
      throw new NotFoundException({
        code: "QUIZ_SESSION_NOT_FOUND",
        message: "Quiz session not found"
      });
    }
    if (!session.is_first_session_of_day) {
      throw new UnprocessableEntityException({
        code: "AD_REWARD_SESSION_NOT_ELIGIBLE",
        message: "Rewarded free-window grant requires first session of day"
      });
    }
    if (!session.ended_at) {
      throw new UnprocessableEntityException({
        code: "AD_REWARD_SESSION_NOT_COMPLETED",
        message: "Rewarded free-window grant requires a completed session"
      });
    }

    return this.db.withTransaction(async (client) => {
      const existingWindow = await client.query<ActiveWindowRow>(
        `
          SELECT id, trigger_session_id, ends_at
          FROM ad_reward_windows
          WHERE user_id = $1
            AND trigger_session_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [userId, sessionId]
      );
      if (existingWindow.rowCount > 0) {
        return {
          grantType: "ad_free_window" as const,
          rewardWindowEndsAt: existingWindow.rows[0].ends_at,
          avatarItem: null
        };
      }

      const impression = await this.lockLatestImpression(
        client,
        userId,
        "rewarded_end_first_session",
        sessionId
      );
      if (!impression) {
        throw new UnprocessableEntityException({
          code: "AD_REWARDED_IMPRESSION_REQUIRED",
          message: "No rewarded impression found for this session"
        });
      }

      const existingGrant = await this.loadGrantForImpression(client, impression.id);
      if (existingGrant) {
        return this.mapExistingGrantResponse(client, existingGrant.id);
      }

      const windowId = randomUUID();
      const createdWindow = await client.query<{ ends_at: string }>(
        `
          INSERT INTO ad_reward_windows
            (id, user_id, trigger_session_id, source, starts_at, ends_at)
          VALUES
            ($1, $2, $3, 'rewarded_end_first_session', NOW(), NOW() + INTERVAL '30 minutes')
          RETURNING ends_at
        `,
        [windowId, userId, sessionId]
      );

      await client.query(
        `
          INSERT INTO rewarded_grants
            (id, user_id, ad_impression_id, grant_type, ad_reward_window_id)
          VALUES
            ($1, $2, $3, 'ad_free_window', $4)
        `,
        [randomUUID(), userId, impression.id, windowId]
      );
      await client.query(
        `
          UPDATE ad_impressions
          SET reward_granted = TRUE
          WHERE id = $1
        `,
        [impression.id]
      );

      return {
        grantType: "ad_free_window" as const,
        rewardWindowEndsAt: createdWindow.rows[0].ends_at,
        avatarItem: null
      };
    });
  }

  private async grantAvatarCosmetic(userId: string, sessionId: string | null) {
    await this.ensureAvatarProgress(userId);

    return this.db.withTransaction(async (client) => {
      const impression = await this.lockLatestImpression(
        client,
        userId,
        "rewarded_avatar_cosmetic",
        sessionId
      );
      if (!impression) {
        throw new UnprocessableEntityException({
          code: "AD_REWARDED_IMPRESSION_REQUIRED",
          message: "No rewarded cosmetic impression found"
        });
      }

      const existingGrant = await this.loadGrantForImpression(client, impression.id);
      if (existingGrant) {
        return this.mapExistingGrantResponse(client, existingGrant.id);
      }

      const inventoryInsert = await client.query<{ item_id: string }>(
        `
          WITH user_stage AS (
            SELECT s.sort_order AS stage_sort
            FROM user_avatar_progress uap
            JOIN avatar_stages s
              ON s.id = uap.current_stage_id
            WHERE uap.user_id = $1
            LIMIT 1
          ),
          candidate AS (
            SELECT ai.id
            FROM avatar_items ai
            CROSS JOIN user_stage us
            LEFT JOIN avatar_stages rs
              ON rs.id = ai.required_stage_id
            LEFT JOIN user_avatar_inventory own
              ON own.user_id = $1
             AND own.item_id = ai.id
            WHERE ai.is_active = TRUE
              AND ai.source_type = 'rewarded'
              AND own.id IS NULL
              AND (
                rs.sort_order IS NULL
                OR rs.sort_order <= us.stage_sort
              )
            ORDER BY random()
            LIMIT 1
          )
          INSERT INTO user_avatar_inventory
            (id, user_id, item_id, acquired_source, acquired_at)
          SELECT
            gen_random_uuid(),
            $1,
            candidate.id,
            'rewarded',
            NOW()
          FROM candidate
          RETURNING item_id
        `,
        [userId]
      );
      if (inventoryInsert.rowCount === 0) {
        throw new UnprocessableEntityException({
          code: "AVATAR_REWARD_NOT_AVAILABLE",
          message: "No rewarded avatar item available to grant"
        });
      }

      const avatarItemId = inventoryInsert.rows[0].item_id;

      await client.query(
        `
          INSERT INTO rewarded_grants
            (id, user_id, ad_impression_id, grant_type, avatar_item_id)
          VALUES
            ($1, $2, $3, 'avatar_cosmetic', $4)
        `,
        [randomUUID(), userId, impression.id, avatarItemId]
      );
      await client.query(
        `
          UPDATE ad_impressions
          SET reward_granted = TRUE
          WHERE id = $1
        `,
        [impression.id]
      );

      const avatarItem = await this.loadAvatarItemById(client, avatarItemId);

      return {
        grantType: "avatar_cosmetic" as const,
        rewardWindowEndsAt: null,
        avatarItem
      };
    });
  }

  private async mapExistingGrantResponse(client: PoolClient, grantId: string) {
    const grant = await client.query<{
      grant_type: RewardGrantType;
      ends_at: string | null;
      avatar_item_id: string | null;
    }>(
      `
        SELECT rg.grant_type, arw.ends_at, rg.avatar_item_id
        FROM rewarded_grants rg
        LEFT JOIN ad_reward_windows arw
          ON arw.id = rg.ad_reward_window_id
        WHERE rg.id = $1
        LIMIT 1
      `,
      [grantId]
    );
    const row = grant.rows[0];
    if (!row) {
      throw new UnprocessableEntityException({
        code: "AD_REWARD_GRANT_CONFLICT",
        message: "Reward grant conflict detected"
      });
    }

    return {
      grantType: row.grant_type,
      rewardWindowEndsAt: row.ends_at,
      avatarItem: row.avatar_item_id ? await this.loadAvatarItemById(client, row.avatar_item_id) : null
    };
  }

  private async loadGrantForImpression(client: PoolClient, impressionId: string) {
    const grant = await client.query<{ id: string }>(
      `
        SELECT id
        FROM rewarded_grants
        WHERE ad_impression_id = $1
        LIMIT 1
      `,
      [impressionId]
    );
    return grant.rows[0] ?? null;
  }

  private async lockLatestImpression(
    client: PoolClient,
    userId: string,
    placement: AdPlacement,
    sessionId: string | null
  ): Promise<{ id: string } | null> {
    const impression = await client.query<{ id: string }>(
      `
        SELECT id
        FROM ad_impressions
        WHERE user_id = $1
          AND placement = $2
          AND ($3::uuid IS NULL OR session_id = $3::uuid)
        ORDER BY shown_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [userId, placement, sessionId]
    );
    return impression.rows[0] ?? null;
  }

  private async isPremiumActive(userId: string): Promise<boolean> {
    const premiumResult = await this.db.query<{ is_premium: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM subscriptions s
          WHERE s.user_id = $1
            AND s.plan = 'premium'
            AND s.status = 'active'
            AND (s.ends_at IS NULL OR s.ends_at > NOW())
        ) AS is_premium
      `,
      [userId]
    );
    return premiumResult.rows[0]?.is_premium ?? false;
  }

  private async getActiveRewardWindow(userId: string): Promise<ActiveWindowRow | null> {
    const result = await this.db.query<ActiveWindowRow>(
      `
        SELECT id, trigger_session_id, ends_at
        FROM ad_reward_windows
        WHERE user_id = $1
          AND ends_at > NOW()
        ORDER BY ends_at DESC
        LIMIT 1
      `,
      [userId]
    );
    return result.rows[0] ?? null;
  }

  private async getRewardWindowForSession(userId: string, sessionId: string): Promise<ActiveWindowRow | null> {
    const result = await this.db.query<ActiveWindowRow>(
      `
        SELECT id, trigger_session_id, ends_at
        FROM ad_reward_windows
        WHERE user_id = $1
          AND trigger_session_id = $2
        LIMIT 1
      `,
      [userId, sessionId]
    );
    return result.rows[0] ?? null;
  }

  private async getOwnedSession(userId: string, sessionId: string): Promise<OwnedSessionRow | null> {
    const session = await this.db.query<OwnedSessionRow>(
      `
        SELECT id, is_first_session_of_day, ended_at
        FROM quiz_sessions
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [sessionId, userId]
    );
    return session.rows[0] ?? null;
  }

  private async ensureAvatarProgress(userId: string): Promise<void> {
    await this.db.withTransaction(async (client) => {
      const current = await client.query<{ user_id: string }>(
        `
          SELECT user_id
          FROM user_avatar_progress
          WHERE user_id = $1
          LIMIT 1
        `,
        [userId]
      );
      if (current.rowCount > 0) {
        return;
      }

      const stage = await client.query<{ id: string }>(
        `
          SELECT id
          FROM avatar_stages
          WHERE code = 'pass_las'
          LIMIT 1
        `
      );
      const passLasStageId = stage.rows[0]?.id;
      if (!passLasStageId) {
        throw new UnprocessableEntityException({
          code: "AVATAR_STAGE_NOT_CONFIGURED",
          message: "Avatar stage pass_las is not configured"
        });
      }

      await client.query(
        `
          INSERT INTO user_profiles (user_id)
          VALUES ($1)
          ON CONFLICT (user_id) DO NOTHING
        `,
        [userId]
      );

      await client.query(
        `
          INSERT INTO user_avatar_progress (user_id, current_stage_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id) DO NOTHING
        `,
        [userId, passLasStageId]
      );
    });
  }

  private async hasRewardedAvatarCandidate(userId: string): Promise<boolean> {
    const result = await this.db.query<{ has_candidate: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM user_avatar_progress uap
          JOIN avatar_stages current_stage
            ON current_stage.id = uap.current_stage_id
          JOIN avatar_items ai
            ON ai.is_active = TRUE
           AND ai.source_type = 'rewarded'
          LEFT JOIN avatar_stages required_stage
            ON required_stage.id = ai.required_stage_id
          LEFT JOIN user_avatar_inventory own
            ON own.user_id = uap.user_id
           AND own.item_id = ai.id
          WHERE uap.user_id = $1
            AND own.id IS NULL
            AND (
              required_stage.sort_order IS NULL
              OR required_stage.sort_order <= current_stage.sort_order
            )
        ) AS has_candidate
      `,
      [userId]
    );
    return result.rows[0]?.has_candidate ?? false;
  }

  private async loadAvatarItemById(client: PoolClient, itemId: string) {
    const item = await client.query<AvatarItemRow>(
      `
        SELECT
          ai.id,
          ai.code,
          ai.name,
          ai.item_type,
          ai.rarity,
          ai.source_type,
          rs.id AS required_stage_id,
          rs.code AS required_stage_code,
          rs.name AS required_stage_name
        FROM avatar_items ai
        LEFT JOIN avatar_stages rs
          ON rs.id = ai.required_stage_id
        WHERE ai.id = $1
        LIMIT 1
      `,
      [itemId]
    );
    const row = item.rows[0];
    if (!row) {
      throw new UnprocessableEntityException({
        code: "AVATAR_ITEM_NOT_FOUND",
        message: "Avatar item not found"
      });
    }
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      itemType: row.item_type,
      rarity: row.rarity,
      sourceType: row.source_type,
      requiredStage:
        row.required_stage_id === null
          ? null
          : {
              id: row.required_stage_id,
              code: row.required_stage_code as string,
              name: row.required_stage_name as string
            }
    };
  }

  private assertRewardGrantCombination(dto: CreateRewardGrantDto): void {
    const placement = dto.placement as AdPlacement;
    const grantType = dto.grantType as RewardGrantType;

    if (grantType === "ad_free_window") {
      if (placement !== "rewarded_end_first_session") {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "ad_free_window grant requires placement rewarded_end_first_session"
        });
      }
      if (!dto.sessionId) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "sessionId is required for ad_free_window grant"
        });
      }
      return;
    }

    if (placement !== "rewarded_avatar_cosmetic") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "avatar_cosmetic grant requires placement rewarded_avatar_cosmetic"
      });
    }
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
