import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const VISIBILITIES = ["public", "friends", "private"] as const;

export class UpdateProfileCustomizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  publicAlias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  profileColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  bio?: string;

  @IsOptional()
  @IsIn(VISIBILITIES)
  visibility?: (typeof VISIBILITIES)[number];
}
