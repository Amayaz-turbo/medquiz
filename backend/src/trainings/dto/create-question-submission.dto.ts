import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";

const QUESTION_TYPES = ["single_choice", "multi_choice", "open_text"] as const;

export class CreateQuestionSubmissionChoiceDto {
  @IsString()
  @MaxLength(280)
  label!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionSubmissionDto {
  @IsUUID("4")
  subjectId!: string;

  @IsUUID("4")
  chapterId!: string;

  @IsIn(QUESTION_TYPES)
  questionType!: (typeof QUESTION_TYPES)[number];

  @IsString()
  @MaxLength(2000)
  prompt!: string;

  @IsString()
  @MaxLength(3000)
  explanation!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  choices?: CreateQuestionSubmissionChoiceDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  acceptedAnswers?: string[];
}
