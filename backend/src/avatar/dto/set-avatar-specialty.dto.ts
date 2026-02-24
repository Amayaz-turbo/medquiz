import { IsUUID } from "class-validator";

export class SetAvatarSpecialtyDto {
  @IsUUID()
  specialtyId!: string;
}
