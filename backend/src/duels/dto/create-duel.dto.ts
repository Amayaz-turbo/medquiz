import { IsIn, IsOptional, IsUUID } from "class-validator";

const MATCHMAKING_MODES = ["friend_invite", "random_free", "random_level"] as const;

export class CreateDuelDto {
  @IsIn(MATCHMAKING_MODES)
  matchmakingMode!: (typeof MATCHMAKING_MODES)[number];

  @IsOptional()
  @IsUUID("4")
  opponentUserId?: string;
}
