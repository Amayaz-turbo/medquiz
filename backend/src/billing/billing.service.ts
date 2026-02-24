import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "../database/database.service";

type SubscriptionPlan = "free" | "premium";
type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";
type SubscriptionProvider = "none" | "stripe" | "apple" | "google";

interface SubscriptionRow {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  started_at: string;
  ends_at: string | null;
}

@Injectable()
export class BillingService {
  constructor(private readonly db: DatabaseService) {}

  async getCurrentSubscription(userId: string) {
    const subscription = await this.db.query<SubscriptionRow>(
      `
        SELECT
          s.plan,
          s.status,
          s.provider,
          s.started_at,
          s.ends_at
        FROM subscriptions s
        WHERE s.user_id = $1
        ORDER BY
          CASE WHEN s.status = 'active' THEN 0 ELSE 1 END ASC,
          s.updated_at DESC,
          s.created_at DESC
        LIMIT 1
      `,
      [userId]
    );
    if (subscription.rowCount > 0) {
      const row = subscription.rows[0];
      return {
        plan: row.plan,
        status: row.status,
        provider: row.provider,
        startedAt: row.started_at,
        endsAt: row.ends_at
      };
    }

    const userResult = await this.db.query<{ created_at: string }>(
      `
        SELECT created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    );
    const createdAt = userResult.rows[0]?.created_at;
    if (!createdAt) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    return {
      plan: "free" as const,
      status: "active" as const,
      provider: "none" as const,
      startedAt: createdAt,
      endsAt: null
    };
  }

  async createCheckoutSession(userId: string, dto: { provider: "stripe" | "apple" | "google"; plan: SubscriptionPlan }) {
    if (dto.plan !== "premium") {
      throw new UnprocessableEntityException({
        code: "BILLING_CHECKOUT_PLAN_UNSUPPORTED",
        message: "Checkout session can only be created for premium plan"
      });
    }

    const activePremium = await this.db.query<{ id: string }>(
      `
        SELECT id
        FROM subscriptions
        WHERE user_id = $1
          AND plan = 'premium'
          AND status = 'active'
          AND (ends_at IS NULL OR ends_at > NOW())
        LIMIT 1
      `,
      [userId]
    );
    if (activePremium.rowCount > 0) {
      throw new UnprocessableEntityException({
        code: "SUBSCRIPTION_ALREADY_ACTIVE",
        message: "An active premium subscription already exists"
      });
    }

    const token = randomUUID();
    if (dto.provider === "stripe") {
      return {
        provider: dto.provider,
        checkoutUrl: `https://checkout.medquiz.local/stripe/${token}`,
        clientSecret: null
      };
    }

    return {
      provider: dto.provider,
      checkoutUrl: null,
      clientSecret: `mock_${dto.provider}_${token}`
    };
  }
}
