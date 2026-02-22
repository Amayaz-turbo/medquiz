import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min
} from "class-validator";

const TRAINING_MODES = ["learning", "discovery", "review", "par_coeur", "rattrapage"] as const;
const STOP_RULES = ["fixed_10", "fixed_custom", "until_stop"] as const;

export class CreateTrainingSessionDto {
  @IsIn(TRAINING_MODES)
  mode!: (typeof TRAINING_MODES)[number];

  @IsIn(STOP_RULES)
  stopRule!: (typeof STOP_RULES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  targetQuestionCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  subjectIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(300)
  @IsUUID("4", { each: true })
  chapterIds?: string[];
}
