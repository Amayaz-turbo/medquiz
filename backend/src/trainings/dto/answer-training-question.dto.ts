import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min
} from "class-validator";

export class AnswerTrainingQuestionDto {
  @IsUUID("4")
  questionId!: string;

  @IsOptional()
  @IsUUID("4")
  selectedChoiceId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @IsUUID("4", { each: true })
  selectedChoiceIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  openTextAnswer?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120000)
  responseTimeMs?: number;
}
