import { IsIn } from "class-validator";

const SUBSCRIPTION_PROVIDERS = ["stripe", "apple", "google"] as const;
const SUBSCRIPTION_PLANS = ["free", "premium"] as const;

export class CreateCheckoutSessionDto {
  @IsIn(SUBSCRIPTION_PROVIDERS)
  provider!: (typeof SUBSCRIPTION_PROVIDERS)[number];

  @IsIn(SUBSCRIPTION_PLANS)
  plan!: (typeof SUBSCRIPTION_PLANS)[number];
}
