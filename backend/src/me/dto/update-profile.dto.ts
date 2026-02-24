import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  studyTrack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  yearLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  uxTone?: string;
}
