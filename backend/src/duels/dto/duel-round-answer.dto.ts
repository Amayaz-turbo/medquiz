import { IsInt, IsUUID, Max, Min } from "class-validator";

export class DuelRoundAnswerDto {
  @IsInt()
  @Min(1)
  @Max(3)
  slotNo!: number;

  @IsUUID("4")
  questionId!: string;

  @IsUUID("4")
  selectedChoiceId!: string;

  @IsInt()
  @Min(1)
  @Max(120000)
  responseTimeMs!: number;
}
