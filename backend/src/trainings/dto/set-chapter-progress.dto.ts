import { IsInt, Max, Min } from "class-validator";

export class SetChapterProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  declaredProgressPct!: number;
}
