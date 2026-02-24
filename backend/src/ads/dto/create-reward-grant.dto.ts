import { IsIn, IsOptional, IsUUID } from "class-validator";

const AD_PLACEMENTS = [
  "rewarded_end_first_session",
  "quiz_start_interstitial",
  "rewarded_avatar_cosmetic"
] as const;

const GRANT_TYPES = ["ad_free_window", "avatar_cosmetic"] as const;

export class CreateRewardGrantDto {
  @IsIn(AD_PLACEMENTS)
  placement!: (typeof AD_PLACEMENTS)[number];

  @IsIn(GRANT_TYPES)
  grantType!: (typeof GRANT_TYPES)[number];

  @IsOptional()
  @IsUUID()
  sessionId?: string | null;
}
