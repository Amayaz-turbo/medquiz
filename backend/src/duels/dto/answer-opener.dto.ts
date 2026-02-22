import { IsInt, IsUUID, Max, Min } from "class-validator";

export class AnswerOpenerDto {
  @IsUUID("4")
  selectedChoiceId!: string;

  @IsInt()
  @Min(1)
  @Max(120000)
  responseTimeMs!: number;
}
