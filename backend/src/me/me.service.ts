import { BadRequestException, Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { UpdateProfileCustomizationDto } from "./dto/update-profile-customization.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { RegisterPushTokenDto } from "./dto/register-push-token.dto";

interface MeRow {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  country_code: string;
  study_track: string | null;
  year_label: string | null;
  ux_tone: string;
  public_alias: string | null;
  profile_color: string | null;
  bio: string | null;
  visibility: "public" | "friends" | "private";
  subscription_plan: "free" | "premium" | null;
  subscription_status: "active" | "past_due" | "cancelled" | "expired" | null;
}

@Injectable()
export class MeService {
  constructor(private readonly db: DatabaseService) {}

  async getMe(userId: string, fallbackEmail: string) {
    await this.ensureProfileRow(userId);

    const result = await this.db.query<MeRow>(
      `
        SELECT
          u.id,
          u.email,
          u.display_name,
          u.timezone,
          u.country_code,
          up.study_track,
          up.year_label,
          up.ux_tone,
          up.public_alias,
          up.profile_color,
          up.bio,
          up.visibility,
          s.plan AS subscription_plan,
          s.status AS subscription_status
        FROM users u
        LEFT JOIN user_profiles up
          ON up.user_id = u.id
        LEFT JOIN LATERAL (
          SELECT plan, status
          FROM subscriptions
          WHERE user_id = u.id
          ORDER BY
            CASE WHEN status = 'active' THEN 0 ELSE 1 END ASC,
            updated_at DESC,
            created_at DESC
          LIMIT 1
        ) s ON TRUE
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );
    const me = result.rows[0];

    return {
      id: me?.id ?? userId,
      email: me?.email ?? fallbackEmail,
      displayName: me?.display_name ?? "",
      timezone: me?.timezone ?? "Europe/Paris",
      countryCode: me?.country_code ?? "FR",
      studyTrack: me?.study_track ?? null,
      yearLabel: me?.year_label ?? null,
      uxTone: me?.ux_tone ?? "supportive",
      publicAlias: me?.public_alias ?? null,
      profileColor: me?.profile_color ?? null,
      bio: me?.bio ?? null,
      visibility: me?.visibility ?? "friends",
      subscription: {
        plan: me?.subscription_plan ?? "free",
        status: me?.subscription_status ?? "active"
      }
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, fallbackEmail: string) {
    const displayName = this.normalizeRequiredDisplayName(dto.displayName);
    const studyTrack = this.normalizeNullableText(dto.studyTrack, 64, "studyTrack");
    const yearLabel = this.normalizeNullableText(dto.yearLabel, 64, "yearLabel");
    const uxTone = this.normalizeOptionalText(dto.uxTone, 32, "uxTone");

    const hasUserUpdate = displayName !== undefined;
    const hasProfileUpdate =
      studyTrack !== undefined || yearLabel !== undefined || uxTone !== undefined;
    if (!hasUserUpdate && !hasProfileUpdate) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "At least one profile field must be provided"
      });
    }

    await this.db.withTransaction(async (client) => {
      await this.ensureProfileRow(userId, client);

      if (hasUserUpdate) {
        await client.query(
          `
            UPDATE users
            SET display_name = $2
            WHERE id = $1
          `,
          [userId, displayName]
        );
      }

      if (hasProfileUpdate) {
        const updates: string[] = [];
        const params: unknown[] = [userId];
        if (studyTrack !== undefined) {
          params.push(studyTrack);
          updates.push(`study_track = $${params.length}`);
        }
        if (yearLabel !== undefined) {
          params.push(yearLabel);
          updates.push(`year_label = $${params.length}`);
        }
        if (uxTone !== undefined) {
          params.push(uxTone);
          updates.push(`ux_tone = $${params.length}`);
        }

        await client.query(
          `
            UPDATE user_profiles
            SET ${updates.join(", ")}
            WHERE user_id = $1
          `,
          params
        );
      }
    });

    return this.getMe(userId, fallbackEmail);
  }

  async updateProfileCustomization(
    userId: string,
    dto: UpdateProfileCustomizationDto,
    fallbackEmail: string
  ) {
    const publicAlias = this.normalizeNullableText(dto.publicAlias, 50, "publicAlias");
    const profileColor = this.normalizeNullableText(dto.profileColor, 32, "profileColor");
    const bio = this.normalizeNullableText(dto.bio, 140, "bio");
    const visibility = dto.visibility;

    const hasUpdate =
      publicAlias !== undefined ||
      profileColor !== undefined ||
      bio !== undefined ||
      visibility !== undefined;
    if (!hasUpdate) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "At least one customization field must be provided"
      });
    }

    await this.db.withTransaction(async (client) => {
      await this.ensureProfileRow(userId, client);

      const updates: string[] = [];
      const params: unknown[] = [userId];
      if (publicAlias !== undefined) {
        params.push(publicAlias);
        updates.push(`public_alias = $${params.length}`);
      }
      if (profileColor !== undefined) {
        params.push(profileColor);
        updates.push(`profile_color = $${params.length}`);
      }
      if (bio !== undefined) {
        params.push(bio);
        updates.push(`bio = $${params.length}`);
      }
      if (visibility !== undefined) {
        params.push(visibility);
        updates.push(`visibility = $${params.length}`);
      }

      await client.query(
        `
          UPDATE user_profiles
          SET ${updates.join(", ")}
          WHERE user_id = $1
        `,
        params
      );
    });

    return this.getMe(userId, fallbackEmail);
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const pushToken = this.normalizePushToken(dto.pushToken);

    return this.db.withTransaction(async (client) => {
      await client.query(
        `
          DELETE FROM user_push_tokens
          WHERE user_id = $1
            AND platform = $2
            AND push_token <> $3
        `,
        [userId, dto.platform, pushToken]
      );

      const saved = await client.query<{
        id: string;
        platform: "ios" | "android" | "web";
        push_token: string;
        last_seen_at: string;
      }>(
        `
          INSERT INTO user_push_tokens
            (id, user_id, platform, push_token, last_seen_at)
          VALUES
            (gen_random_uuid(), $1, $2, $3, NOW())
          ON CONFLICT (platform, push_token)
          DO UPDATE
          SET
            user_id = EXCLUDED.user_id,
            last_seen_at = NOW(),
            updated_at = NOW()
          RETURNING id, platform, push_token, last_seen_at
        `,
        [userId, dto.platform, pushToken]
      );

      const row = saved.rows[0];
      return {
        id: row.id,
        platform: row.platform,
        pushToken: row.push_token,
        lastSeenAt: row.last_seen_at
      };
    });
  }

  private async ensureProfileRow(userId: string, client?: PoolClient): Promise<void> {
    const runner = client ?? this.db;
    await runner.query(
      `
        INSERT INTO user_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId]
    );
  }

  private normalizeRequiredDisplayName(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    if (normalized.length < 2 || normalized.length > 64) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "displayName must be between 2 and 64 characters"
      });
    }
    return normalized;
  }

  private normalizeOptionalText(
    value: string | undefined,
    maxLength: number,
    field: string
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} cannot be empty`
      });
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be at most ${maxLength} characters`
      });
    }
    return normalized;
  }

  private normalizeNullableText(
    value: string | undefined,
    maxLength: number,
    field: string
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be at most ${maxLength} characters`
      });
    }
    return normalized;
  }

  private normalizePushToken(value: string): string {
    const normalized = value.trim();
    if (normalized.length < 20 || normalized.length > 512) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "pushToken must be between 20 and 512 characters"
      });
    }
    return normalized;
  }
}
