import { Injectable, Logger } from "@nestjs/common";
import { PoolClient } from "pg";
import { env } from "../config/env";
import { DatabaseService } from "../database/database.service";

interface PendingNotificationRow {
  id: string;
  user_id: string;
  type: "duel_turn" | "duel_joker_request" | "duel_joker_granted" | "duel_finished" | "review_reminder";
  payload: Record<string, unknown> | string | null;
  created_at: string;
}

interface PushTokenRow {
  platform: "ios" | "android" | "web";
  push_token: string;
}

interface DispatchResult {
  processed: number;
  sent: number;
  failed: number;
}

@Injectable()
export class NotificationPushDispatchService {
  private readonly logger = new Logger(NotificationPushDispatchService.name);
  private readonly cfg = env();

  constructor(private readonly db: DatabaseService) {}

  async dispatchPending(limit = this.cfg.pushNotificationsBatchSize): Promise<DispatchResult> {
    const safeLimit = Math.max(1, Math.min(limit, this.cfg.pushNotificationsBatchSize));

    return this.db.withTransaction(async (client) => {
      const pending = await client.query<PendingNotificationRow>(
        `
          SELECT
            n.id,
            n.user_id,
            n.type,
            n.payload,
            n.created_at
          FROM notifications n
          WHERE n.status = 'pending'
          ORDER BY n.created_at ASC, n.id ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        `,
        [safeLimit]
      );

      let sent = 0;
      let failed = 0;

      for (const notification of pending.rows) {
        const tokens = await this.listUserPushTokens(client, notification.user_id);
        if (tokens.length === 0) {
          await this.markNotificationFailed(client, notification.id);
          failed += 1;
          continue;
        }

        let delivered = false;
        for (const token of tokens) {
          const ok = await this.deliverToToken(token, notification);
          if (ok) {
            delivered = true;
          }
        }

        if (delivered) {
          await this.markNotificationSent(client, notification.id);
          sent += 1;
        } else {
          await this.markNotificationFailed(client, notification.id);
          failed += 1;
        }
      }

      return {
        processed: pending.rowCount,
        sent,
        failed
      };
    });
  }

  private async listUserPushTokens(client: PoolClient, userId: string): Promise<PushTokenRow[]> {
    const tokens = await client.query<PushTokenRow>(
      `
        SELECT platform, push_token
        FROM user_push_tokens
        WHERE user_id = $1
        ORDER BY last_seen_at DESC, updated_at DESC
      `,
      [userId]
    );
    return tokens.rows;
  }

  private async markNotificationSent(client: PoolClient, notificationId: string): Promise<void> {
    await client.query(
      `
        UPDATE notifications
        SET
          status = 'sent',
          sent_at = COALESCE(sent_at, NOW())
        WHERE id = $1
          AND status = 'pending'
      `,
      [notificationId]
    );
  }

  private async markNotificationFailed(client: PoolClient, notificationId: string): Promise<void> {
    await client.query(
      `
        UPDATE notifications
        SET status = 'failed'
        WHERE id = $1
          AND status = 'pending'
      `,
      [notificationId]
    );
  }

  private async deliverToToken(token: PushTokenRow, notification: PendingNotificationRow): Promise<boolean> {
    if (!this.cfg.pushNotificationsWebhookUrl) {
      this.logger.log(
        `push delivered (local mode) notificationId=${notification.id} platform=${token.platform}`
      );
      return true;
    }

    const body = {
      notificationId: notification.id,
      userId: notification.user_id,
      type: notification.type,
      payload: this.normalizePayload(notification.payload),
      createdAt: new Date(notification.created_at).toISOString(),
      target: {
        platform: token.platform,
        pushToken: token.push_token
      }
    };

    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (this.cfg.pushNotificationsWebhookToken) {
      headers.authorization = `Bearer ${this.cfg.pushNotificationsWebhookToken}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.cfg.pushNotificationsWebhookTimeoutMs);
      try {
        const response = await fetch(this.cfg.pushNotificationsWebhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        if (!response.ok) {
          this.logger.warn(
            `push delivery failed notificationId=${notification.id} platform=${token.platform} status=${response.status}`
          );
          return false;
        }
        return true;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `push delivery error notificationId=${notification.id} platform=${token.platform} error=${message}`
      );
      return false;
    }
  }

  private normalizePayload(value: PendingNotificationRow["payload"]): Record<string, unknown> {
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
}
