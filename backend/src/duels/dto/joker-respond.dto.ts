import { IsIn } from "class-validator";

const JOKER_DECISIONS = ["grant", "reject"] as const;

export class JokerRespondDto {
  @IsIn(JOKER_DECISIONS)
  decision!: (typeof JOKER_DECISIONS)[number];
}
