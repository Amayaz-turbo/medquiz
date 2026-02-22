import { IsIn } from "class-validator";

const DECISIONS = ["take_hand", "leave_hand"] as const;

export class OpenerDecisionDto {
  @IsIn(DECISIONS)
  decision!: (typeof DECISIONS)[number];
}
