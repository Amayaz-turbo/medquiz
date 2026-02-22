import { IsOptional, IsString, MaxLength } from "class-validator";

export class JokerRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}
