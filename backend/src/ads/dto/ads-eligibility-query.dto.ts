import { IsIn, IsOptional, IsUUID } from "class-validator";

const AD_PLACEMENTS = [
  "rewarded_end_first_session",
  "quiz_start_interstitial",
  "rewarded_avatar_cosmetic"
] as const;

export class AdsEligibilityQueryDto {
  @IsIn(AD_PLACEMENTS)
  placement!: (typeof AD_PLACEMENTS)[number];

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
