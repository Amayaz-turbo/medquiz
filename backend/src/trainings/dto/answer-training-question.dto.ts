import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class AnswerTrainingQuestionDto {
  @IsUUID("4")
  questionId!: string;

  @IsUUID("4")
  selectedChoiceId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120000)
  responseTimeMs?: number;
}
