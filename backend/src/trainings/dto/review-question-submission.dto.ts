import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const REVIEW_DECISIONS = ["approve", "reject"] as const;

export class ReviewQuestionSubmissionDto {
  @IsIn(REVIEW_DECISIONS)
  decision!: (typeof REVIEW_DECISIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
