import { Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";

interface UserRow {
  id: string;
  email: string;
  display_name: string;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async createUserWithPassword(params: {
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise<UserRow> {
    return this.db.withTransaction(async (client) => this.createUserWithPasswordTx(client, params));
  }

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `
        SELECT id, email, display_name
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );
    return result.rows[0] ?? null;
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    const result = await this.db.query<{ password_hash: string }>(
      `
        SELECT password_hash
        FROM auth_credentials
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    return result.rows[0]?.password_hash ?? null;
  }

  async createRefreshToken(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<void> {
    await this.db.query(
      `
        INSERT INTO auth_refresh_tokens
          (id, user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES
          ($1, $2, $3, $4, $5, $6)
      `,
      [
        params.id,
        params.userId,
        params.tokenHash,
        params.expiresAt,
        params.userAgent,
        params.ipAddress
      ]
    );
  }

  async findRefreshTokenById(tokenId: string): Promise<RefreshTokenRow | null> {
    const result = await this.db.query<RefreshTokenRow>(
      `
        SELECT id, user_id, token_hash, expires_at, revoked_at
        FROM auth_refresh_tokens
        WHERE id = $1
        LIMIT 1
      `,
      [tokenId]
    );
    return result.rows[0] ?? null;
  }

  async revokeRefreshToken(params: {
    tokenId: string;
    replacedByTokenId?: string;
  }): Promise<boolean> {
    const result = await this.db.query<{ id: string }>(
      `
        UPDATE auth_refresh_tokens
        SET revoked_at = NOW(),
            replaced_by_token_id = COALESCE($2, replaced_by_token_id)
        WHERE id = $1
          AND revoked_at IS NULL
        RETURNING id
      `,
      [params.tokenId, params.replacedByTokenId ?? null]
    );
    return result.rowCount > 0;
  }

  private async createUserWithPasswordTx(
    client: PoolClient,
    params: { email: string; displayName: string; passwordHash: string }
  ): Promise<UserRow> {
    let passLasStageId: string | null = null;
    try {
      const stageResult = await client.query<{ id: string }>(
        `
          SELECT id
          FROM avatar_stages
          WHERE code = 'pass_las'
          LIMIT 1
        `
      );
      passLasStageId = stageResult.rows[0]?.id ?? null;
    } catch {
      passLasStageId = null;
    }

    const userResult = await client.query<UserRow>(
      `
        INSERT INTO users (id, email, display_name)
        VALUES (gen_random_uuid(), $1, $2)
        RETURNING id, email, display_name
      `,
      [params.email, params.displayName]
    );
    const user = userResult.rows[0];

    await client.query(
      `
        INSERT INTO auth_credentials (user_id, password_hash)
        VALUES ($1, $2)
      `,
      [user.id, params.passwordHash]
    );

    await client.query(
      `
        INSERT INTO user_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [user.id]
    );

    if (passLasStageId) {
      try {
        await client.query(
          `
            INSERT INTO user_avatar_progress (user_id, current_stage_id)
            VALUES ($1, $2)
          `,
          [user.id, passLasStageId]
        );
      } catch {
        // Keep auth registration resilient even if avatar progression tables are not fully seeded.
      }
    }

    return user;
  }
}
