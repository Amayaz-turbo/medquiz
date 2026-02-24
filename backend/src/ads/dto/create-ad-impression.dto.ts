import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

const AD_PLACEMENTS = [
  "rewarded_end_first_session",
  "quiz_start_interstitial",
  "rewarded_avatar_cosmetic"
] as const;

export class CreateAdImpressionDto {
  @IsIn(AD_PLACEMENTS)
  placement!: (typeof AD_PLACEMENTS)[number];

  @IsOptional()
  @IsUUID()
  sessionId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  network?: string;

  @IsOptional()
  @IsBoolean()
  rewardGranted?: boolean;
}
