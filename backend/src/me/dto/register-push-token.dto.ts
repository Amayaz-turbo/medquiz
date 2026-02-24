import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

const PUSH_PLATFORMS = ["ios", "android", "web"] as const;

export class RegisterPushTokenDto {
  @IsIn(PUSH_PLATFORMS)
  platform!: (typeof PUSH_PLATFORMS)[number];

  @IsString()
  @MinLength(20)
  @MaxLength(512)
  pushToken!: string;
}
