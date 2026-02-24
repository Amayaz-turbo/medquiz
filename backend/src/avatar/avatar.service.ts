import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { EquipAvatarItemDto } from "./dto/equip-avatar-item.dto";
import { SetAvatarSpecialtyDto } from "./dto/set-avatar-specialty.dto";

type AvatarItemType = "object" | "pose" | "outfit" | "background";

interface AvatarStateRow {
  xp_points: number | string;
  current_stage_id: string;
  current_stage_code: string;
  current_stage_name: string;
  current_stage_sort_order: number | string;
  specialty_id: string | null;
  specialty_code: string | null;
  specialty_name: string | null;
}

interface AvatarStageRow {
  id: string;
  code: string;
  name: string;
  sort_order: number | string;
}

interface AvatarSpecialtyRow {
  id: string;
  code: string;
  name: string;
}

interface AvatarItemRow {
  id: string;
  code: string;
  name: string;
  item_type: AvatarItemType;
  rarity: string;
  source_type: string;
  required_stage_id: string | null;
  required_stage_code: string | null;
  required_stage_name: string | null;
}

interface AvatarInventorySummaryRow {
  item_type: AvatarItemType;
  owned_count: number | string;
}

interface AvatarEquipmentRow extends AvatarItemRow {
  equipped_at: string;
}

@Injectable()
export class AvatarService {
  constructor(private readonly db: DatabaseService) {}

  async listAvatarStages() {
    const stages = await this.db.query<AvatarStageRow>(
      `
        SELECT id, code, name, sort_order
        FROM avatar_stages
        WHERE is_active = TRUE
        ORDER BY sort_order ASC
      `
    );

    return {
      items: stages.rows.map((stage) => ({
        id: stage.id,
        code: stage.code,
        name: stage.name,
        sortOrder: Number(stage.sort_order)
      }))
    };
  }

  async listMedicalSpecialties() {
    const specialties = await this.db.query<AvatarSpecialtyRow>(
      `
        SELECT id, code, name
        FROM medical_specialties
        WHERE is_active = TRUE
        ORDER BY name ASC
      `
    );

    return {
      items: specialties.rows.map((specialty) => ({
        id: specialty.id,
        code: specialty.code,
        name: specialty.name
      }))
    };
  }

  async getMyAvatarState(userId: string) {
    await this.ensureAvatarProgress(userId);
    await this.syncProgressionInventory(userId);
    return this.loadAvatarState(userId);
  }

  async getMyAvatarInventory(userId: string, itemType?: AvatarItemType) {
    await this.ensureAvatarProgress(userId);
    await this.syncProgressionInventory(userId);

    const inventoryResult = await this.db.query<
      AvatarItemRow & {
        acquired_at: string;
        acquired_source: string;
        equipped_at: string | null;
      }
    >(
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
          rs.name AS required_stage_name,
          uai.acquired_at,
          uai.acquired_source,
          uae.equipped_at
        FROM user_avatar_inventory uai
        JOIN avatar_items ai
          ON ai.id = uai.item_id
        LEFT JOIN avatar_stages rs
          ON rs.id = ai.required_stage_id
        LEFT JOIN user_avatar_equipment uae
          ON uae.user_id = uai.user_id
         AND uae.item_type = ai.item_type
         AND uae.item_id = ai.id
        WHERE uai.user_id = $1
          AND ($2::avatar_item_type IS NULL OR ai.item_type = $2::avatar_item_type)
        ORDER BY uai.acquired_at DESC, ai.code ASC
      `,
      [userId, itemType ?? null]
    );

    return {
      items: inventoryResult.rows.map((item) => ({
        ...this.toAvatarItemView(item),
        acquiredAt: item.acquired_at,
        acquiredSource: item.acquired_source,
        equipped: item.equipped_at !== null,
        equippedAt: item.equipped_at
      }))
    };
  }

  async equipMyAvatarItem(userId: string, dto: EquipAvatarItemDto) {
    await this.ensureAvatarProgress(userId);
    await this.syncProgressionInventory(userId);

    return this.db.withTransaction(async (client) => {
      const item = await this.getAvatarItemForUpdate(client, dto.itemId);

      if (item.item_type !== dto.itemType) {
        throw new UnprocessableEntityException({
          code: "AVATAR_ITEM_TYPE_MISMATCH",
          message: "itemType does not match avatar item type"
        });
      }

      const owned = await client.query<{ id: string }>(
        `
          SELECT id
          FROM user_avatar_inventory
          WHERE user_id = $1
            AND item_id = $2
          LIMIT 1
        `,
        [userId, item.id]
      );
      if (owned.rowCount === 0) {
        throw new UnprocessableEntityException({
          code: "AVATAR_ITEM_NOT_OWNED",
          message: "User does not own this avatar item"
        });
      }

      const progress = await this.getUserProgressState(client, userId);
      const requiredOrder = item.required_stage_id ? await this.getStageOrderById(client, item.required_stage_id) : null;
      if (requiredOrder !== null && progress.currentStageSortOrder < requiredOrder) {
        throw new UnprocessableEntityException({
          code: "AVATAR_STAGE_TOO_LOW",
          message: "Current avatar stage is too low for this item"
        });
      }

      await client.query(
        `
          INSERT INTO user_avatar_equipment (user_id, item_type, item_id, equipped_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, item_type)
          DO UPDATE SET item_id = EXCLUDED.item_id, equipped_at = NOW()
        `,
        [userId, item.item_type, item.id]
      );

      return {
        itemType: item.item_type,
        item: this.toAvatarItemView(item)
      };
    });
  }

  async setMyAvatarSpecialty(userId: string, dto: SetAvatarSpecialtyDto) {
    await this.ensureAvatarProgress(userId);

    return this.db.withTransaction(async (client) => {
      const specialty = await client.query<AvatarSpecialtyRow>(
        `
          SELECT id, code, name
          FROM medical_specialties
          WHERE id = $1
            AND is_active = TRUE
          LIMIT 1
        `,
        [dto.specialtyId]
      );
      if (specialty.rowCount === 0) {
        throw new NotFoundException({
          code: "AVATAR_SPECIALTY_NOT_FOUND",
          message: "Medical specialty not found"
        });
      }

      const progress = await this.getUserProgressState(client, userId);
      const internOrder = await this.getInternStageOrder(client);
      if (progress.currentStageSortOrder < internOrder) {
        throw new UnprocessableEntityException({
          code: "AVATAR_SPECIALTY_STAGE_LOCKED",
          message: "Specialty can only be set from Interne stage and above"
        });
      }

      await client.query(
        `
          UPDATE user_avatar_progress
          SET specialty_id = $2
          WHERE user_id = $1
        `,
        [userId, specialty.rows[0].id]
      );

      return {
        specialty: {
          id: specialty.rows[0].id,
          code: specialty.rows[0].code,
          name: specialty.rows[0].name
        }
      };
    });
  }

  private async loadAvatarState(userId: string) {
    const avatarResult = await this.db.query<AvatarStateRow>(
      `
        SELECT
          uap.xp_points,
          cs.id AS current_stage_id,
          cs.code AS current_stage_code,
          cs.name AS current_stage_name,
          cs.sort_order AS current_stage_sort_order,
          ms.id AS specialty_id,
          ms.code AS specialty_code,
          ms.name AS specialty_name
        FROM user_avatar_progress uap
        JOIN avatar_stages cs
          ON cs.id = uap.current_stage_id
        LEFT JOIN medical_specialties ms
          ON ms.id = uap.specialty_id
        WHERE uap.user_id = $1
        LIMIT 1
      `,
      [userId]
    );

    const row = avatarResult.rows[0];
    if (!row) {
      throw new InternalServerErrorException({
        code: "AVATAR_PROGRESS_MISSING",
        message: "Avatar progress is not initialized"
      });
    }

    const currentSortOrder = Number(row.current_stage_sort_order);

    const [nextStageResult, summaryResult, equipmentResult] = await Promise.all([
      this.db.query<AvatarStageRow>(
        `
          SELECT id, code, name, sort_order
          FROM avatar_stages
          WHERE is_active = TRUE
            AND sort_order > $1
          ORDER BY sort_order ASC
          LIMIT 1
        `,
        [currentSortOrder]
      ),
      this.db.query<AvatarInventorySummaryRow>(
        `
          SELECT ai.item_type, COUNT(*)::text AS owned_count
          FROM user_avatar_inventory uai
          JOIN avatar_items ai
            ON ai.id = uai.item_id
          WHERE uai.user_id = $1
          GROUP BY ai.item_type
        `,
        [userId]
      ),
      this.db.query<AvatarEquipmentRow>(
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
            rs.name AS required_stage_name,
            uae.equipped_at
          FROM user_avatar_equipment uae
          JOIN avatar_items ai
            ON ai.id = uae.item_id
          LEFT JOIN avatar_stages rs
            ON rs.id = ai.required_stage_id
          WHERE uae.user_id = $1
        `,
        [userId]
      )
    ]);

    const ownedByType: Record<AvatarItemType, number> = {
      object: 0,
      pose: 0,
      outfit: 0,
      background: 0
    };
    for (const item of summaryResult.rows) {
      ownedByType[item.item_type] = Number(item.owned_count);
    }

    const equipped: Record<AvatarItemType, ReturnType<AvatarService["toAvatarItemView"]> | null> = {
      object: null,
      pose: null,
      outfit: null,
      background: null
    };
    for (const item of equipmentResult.rows) {
      equipped[item.item_type] = this.toAvatarItemView(item);
    }

    const nextStage = nextStageResult.rows[0];

    return {
      xpPoints: Number(row.xp_points),
      currentStage: {
        id: row.current_stage_id,
        code: row.current_stage_code,
        name: row.current_stage_name,
        sortOrder: currentSortOrder
      },
      nextStage: nextStage
        ? {
            id: nextStage.id,
            code: nextStage.code,
            name: nextStage.name,
            sortOrder: Number(nextStage.sort_order)
          }
        : null,
      specialty:
        row.specialty_id === null
          ? null
          : {
              id: row.specialty_id,
              code: row.specialty_code as string,
              name: row.specialty_name as string
            },
      inventorySummary: {
        totalOwned: Object.values(ownedByType).reduce((sum, count) => sum + count, 0),
        ownedByType
      },
      equipment: equipped
    };
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
        throw new InternalServerErrorException({
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

  private async syncProgressionInventory(userId: string): Promise<void> {
    await this.db.query(
      `
        INSERT INTO user_avatar_inventory (id, user_id, item_id, acquired_source, acquired_at)
        SELECT
          gen_random_uuid(),
          $1,
          ai.id,
          'progression',
          NOW()
        FROM user_avatar_progress uap
        JOIN avatar_stages user_stage
          ON user_stage.id = uap.current_stage_id
        JOIN avatar_items ai
          ON ai.is_active = TRUE
         AND ai.source_type = 'progression'
        LEFT JOIN avatar_stages required_stage
          ON required_stage.id = ai.required_stage_id
        LEFT JOIN user_avatar_inventory own
          ON own.user_id = $1
         AND own.item_id = ai.id
        WHERE uap.user_id = $1
          AND own.id IS NULL
          AND (
            required_stage.sort_order IS NULL
            OR required_stage.sort_order <= user_stage.sort_order
          )
      `,
      [userId]
    );
  }

  private async getAvatarItemForUpdate(client: PoolClient, itemId: string): Promise<AvatarItemRow> {
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
          AND ai.is_active = TRUE
        LIMIT 1
      `,
      [itemId]
    );
    if (item.rowCount === 0) {
      throw new NotFoundException({
        code: "AVATAR_ITEM_NOT_FOUND",
        message: "Avatar item not found"
      });
    }
    return item.rows[0];
  }

  private async getStageOrderById(client: PoolClient, stageId: string): Promise<number | null> {
    const result = await client.query<{ sort_order: number | string }>(
      `
        SELECT sort_order
        FROM avatar_stages
        WHERE id = $1
        LIMIT 1
      `,
      [stageId]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return Number(result.rows[0].sort_order);
  }

  private async getInternStageOrder(client: PoolClient): Promise<number> {
    const result = await client.query<{ sort_order: number | string }>(
      `
        SELECT sort_order
        FROM avatar_stages
        WHERE code = 'interne'
        LIMIT 1
      `
    );
    const row = result.rows[0];
    if (!row) {
      throw new InternalServerErrorException({
        code: "AVATAR_STAGE_NOT_CONFIGURED",
        message: "Avatar stage interne is not configured"
      });
    }
    return Number(row.sort_order);
  }

  private async getUserProgressState(
    client: PoolClient,
    userId: string
  ): Promise<{ currentStageSortOrder: number }> {
    const result = await client.query<{ sort_order: number | string }>(
      `
        SELECT s.sort_order
        FROM user_avatar_progress uap
        JOIN avatar_stages s
          ON s.id = uap.current_stage_id
        WHERE uap.user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new InternalServerErrorException({
        code: "AVATAR_PROGRESS_MISSING",
        message: "Avatar progress is not initialized"
      });
    }
    return {
      currentStageSortOrder: Number(row.sort_order)
    };
  }

  private toAvatarItemView(item: AvatarItemRow) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      itemType: item.item_type,
      rarity: item.rarity,
      sourceType: item.source_type,
      requiredStage:
        item.required_stage_id === null
          ? null
          : {
              id: item.required_stage_id,
              code: item.required_stage_code as string,
              name: item.required_stage_name as string
            }
    };
  }
}
