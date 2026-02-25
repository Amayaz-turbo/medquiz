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
  dispatch_attempt_count: number;
  next_dispatch_at: string;
}

interface PushTokenRow {
  platform: "ios" | "android" | "web";
  push_token: string;
}

interface DispatchResult {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}

interface DeliveryOutcome {
  ok: boolean;
  errorCode: string | null;
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
            n.created_at,
            n.dispatch_attempt_count,
            n.next_dispatch_at
          FROM notifications n
          WHERE n.status = 'pending'
            AND n.next_dispatch_at <= NOW()
          ORDER BY n.next_dispatch_at ASC, n.created_at ASC, n.id ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        `,
        [safeLimit]
      );

      let sent = 0;
      let failed = 0;
      let retried = 0;

      for (const notification of pending.rows) {
        const delivery = await this.deliverNotification(client, notification);
        if (delivery.ok) {
          await this.markNotificationSent(client, notification.id);
          sent += 1;
        } else {
          const outcome = await this.registerFailedAttempt(
            client,
            notification,
            delivery.errorCode ?? "PUSH_DELIVERY_FAILED"
          );
          if (outcome === "failed") {
            failed += 1;
          } else {
            retried += 1;
          }
        }
      }

      return {
        processed: pending.rowCount,
        sent,
        failed,
        retried
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
          sent_at = COALESCE(sent_at, NOW()),
          last_dispatch_error = NULL
        WHERE id = $1
          AND status = 'pending'
      `,
      [notificationId]
    );
  }

  private async deliverNotification(
    client: PoolClient,
    notification: PendingNotificationRow
  ): Promise<DeliveryOutcome> {
    const tokens = await this.listUserPushTokens(client, notification.user_id);
    if (tokens.length === 0) {
      return {
        ok: false,
        errorCode: "NO_PUSH_TOKEN"
      };
    }

    let lastErrorCode = "PUSH_DELIVERY_FAILED";
    for (const token of tokens) {
      const delivery = await this.deliverToToken(token, notification);
      if (delivery.ok) {
        return {
          ok: true,
          errorCode: null
        };
      }
      lastErrorCode = delivery.errorCode ?? lastErrorCode;
    }

    return {
      ok: false,
      errorCode: lastErrorCode
    };
  }

  private async registerFailedAttempt(
    client: PoolClient,
    notification: PendingNotificationRow,
    errorCode: string
  ): Promise<"failed" | "retried"> {
    const nextAttemptCount = notification.dispatch_attempt_count + 1;
    if (nextAttemptCount >= this.cfg.pushNotificationsMaxAttempts) {
      await client.query(
        `
          UPDATE notifications
          SET
            status = 'failed',
            dispatch_attempt_count = $2,
            last_dispatch_error = $3
          WHERE id = $1
            AND status = 'pending'
        `,
        [notification.id, nextAttemptCount, errorCode]
      );
      return "failed";
    }

    const backoffSeconds = this.computeBackoffSeconds(nextAttemptCount);
    await client.query(
      `
        UPDATE notifications
        SET
          dispatch_attempt_count = $2,
          next_dispatch_at = NOW() + ($3::integer * INTERVAL '1 second'),
          last_dispatch_error = $4
        WHERE id = $1
          AND status = 'pending'
      `,
      [notification.id, nextAttemptCount, backoffSeconds, errorCode]
    );
    return "retried";
  }

  private computeBackoffSeconds(attemptCount: number): number {
    const safeAttempt = Math.max(1, attemptCount);
    const raw = this.cfg.pushNotificationsBackoffBaseSeconds * 2 ** (safeAttempt - 1);
    return Math.min(this.cfg.pushNotificationsBackoffMaxSeconds, Math.round(raw));
  }

  private async deliverToToken(
    token: PushTokenRow,
    notification: PendingNotificationRow
  ): Promise<DeliveryOutcome> {
    if (!this.cfg.pushNotificationsWebhookUrl) {
      this.logger.log(
        `push delivered (local mode) notificationId=${notification.id} platform=${token.platform}`
      );
      return {
        ok: true,
        errorCode: null
      };
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
          return {
            ok: false,
            errorCode: `HTTP_${response.status}`
          };
        }
        return {
          ok: true,
          errorCode: null
        };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `push delivery error notificationId=${notification.id} platform=${token.platform} error=${message}`
      );
      return {
        ok: false,
        errorCode: "NETWORK_ERROR"
      };
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
