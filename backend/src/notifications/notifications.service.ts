import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { env } from "../config/env";
import { DatabaseService } from "../database/database.service";

type NotificationStatus = "pending" | "sent" | "failed" | "read";

interface NotificationRow {
  id: string;
  type: "duel_turn" | "duel_joker_request" | "duel_joker_granted" | "duel_finished" | "review_reminder";
  payload: Record<string, unknown> | string | null;
  status: NotificationStatus;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
}

interface NotificationCursor {
  createdAt: string;
  id: string;
}

interface ListNotificationsOptions {
  status?: string;
  limit?: string;
  cursor?: string;
}

@Injectable()
export class NotificationsService {
  private readonly cfg = env();

  constructor(private readonly db: DatabaseService) {}

  async listNotifications(userId: string, options: ListNotificationsOptions) {
    const status = this.parseStatus(options.status);
    const limit = this.parsePositiveInteger(options.limit, 20, 1, 100, "limit");
    const cursor = this.parseCursor(options.cursor);

    const where: string[] = ["n.user_id = $1"];
    const params: unknown[] = [userId];

    if (status) {
      params.push(status);
      where.push(`n.status = $${params.length}::notification_status`);
    }
    if (cursor) {
      params.push(cursor.createdAt);
      params.push(cursor.id);
      where.push(`(n.created_at, n.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    params.push(limit + 1);
    const result = await this.db.query<NotificationRow>(
      `
        SELECT
          n.id,
          n.type,
          n.payload,
          n.status,
          n.created_at,
          n.sent_at,
          n.read_at
        FROM notifications n
        WHERE ${where.join(" AND ")}
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $${params.length}
      `,
      params
    );

    const hasMore = result.rows.length > limit;
    const pageRows = hasMore ? result.rows.slice(0, limit) : result.rows;

    const items = pageRows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      payload: this.toPayloadObject(row.payload),
      createdAt: this.toIsoDate(row.created_at),
      sentAt: this.toIsoDateOrNull(row.sent_at),
      readAt: this.toIsoDateOrNull(row.read_at)
    }));

    const last = pageRows[pageRows.length - 1];
    return {
      items,
      meta: {
        nextCursor: hasMore && last ? this.encodeCursor({ createdAt: this.toIsoDate(last.created_at), id: last.id }) : null
      }
    };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const result = await this.db.query<{ id: string; status: NotificationStatus; read_at: string | null }>(
      `
        UPDATE notifications
        SET
          status = 'read',
          read_at = COALESCE(read_at, NOW())
        WHERE id = $1
          AND user_id = $2
        RETURNING id, status, read_at
      `,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundException({
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      });
    }

    const row = result.rows[0];
    return {
      id: row.id,
      status: row.status,
      readAt: row.read_at
    };
  }

  async requeueFailedNotifications(requestedByUserId: string, limitRaw?: number) {
    this.assertNotificationsAdminAccess(requestedByUserId);
    const limit = this.parsePositiveInteger(
      typeof limitRaw === "number" ? String(limitRaw) : undefined,
      100,
      1,
      1000,
      "limit"
    );

    const result = await this.db.withTransaction(async (client) => {
      const updated = await client.query<{ id: string }>(
        `
          WITH target AS (
            SELECT n.id
            FROM notifications n
            WHERE n.status = 'failed'
            ORDER BY n.created_at ASC, n.id ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
          )
          UPDATE notifications n
          SET
            status = 'pending',
            dispatch_attempt_count = 0,
            next_dispatch_at = NOW(),
            last_dispatch_error = NULL
          FROM target
          WHERE n.id = target.id
          RETURNING n.id
        `,
        [limit]
      );

      return updated.rowCount;
    });

    return {
      requeuedCount: result
    };
  }

  private parseStatus(raw: string | undefined): NotificationStatus | null {
    if (raw === undefined || raw === null || raw.trim().length === 0) {
      return null;
    }
    const normalized = raw.trim().toLowerCase();
    if (normalized === "pending" || normalized === "sent" || normalized === "failed" || normalized === "read") {
      return normalized;
    }
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "status must be one of: pending, sent, failed, read"
    });
  }

  private parsePositiveInteger(
    raw: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
    field: string
  ): number {
    if (raw === undefined || raw === null || raw === "") {
      return defaultValue;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be an integer in range ${min}..${max}`
      });
    }
    return parsed;
  }

  private assertNotificationsAdminAccess(userId: string): void {
    const allowlist = this.cfg.notificationsAdminUserIds;
    if (allowlist.length === 0) {
      if (this.cfg.nodeEnv === "production") {
        throw new ForbiddenException({
          code: "NOTIFICATIONS_ADMIN_ALLOWLIST_REQUIRED",
          message: "Notifications admin allowlist is required in production"
        });
      }
      return;
    }

    if (!allowlist.includes(userId)) {
      throw new ForbiddenException({
        code: "NOTIFICATIONS_ADMIN_FORBIDDEN",
        message: "Notifications admin access required"
      });
    }
  }

  private parseCursor(raw: string | undefined): NotificationCursor | null {
    if (!raw) {
      return null;
    }

    try {
      const decoded = Buffer.from(raw, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded) as { createdAt?: string; id?: string };
      const createdAt = parsed.createdAt;
      const id = parsed.id;
      if (!createdAt || !id) {
        throw new Error("Malformed cursor");
      }

      const timestamp = new Date(createdAt).getTime();
      if (!Number.isFinite(timestamp)) {
        throw new Error("Malformed cursor timestamp");
      }
      if (!this.isUuid(id)) {
        throw new Error("Malformed cursor id");
      }

      return { createdAt, id };
    } catch {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid cursor"
      });
    }
  }

  private encodeCursor(cursor: NotificationCursor): string {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  }

  private toPayloadObject(value: NotificationRow["payload"]): Record<string, unknown> {
    if (value && typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return {};
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private toIsoDate(value: string): string {
    const date = new Date(value);
    const ms = date.getTime();
    if (!Number.isFinite(ms)) {
      return value;
    }
    return date.toISOString();
  }

  private toIsoDateOrNull(value: string | null): string | null {
    if (value === null) {
      return null;
    }
    return this.toIsoDate(value);
  }
}
