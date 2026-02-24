import { IsIn, IsUUID } from "class-validator";

const AVATAR_ITEM_TYPES = ["object", "pose", "outfit", "background"] as const;

export class EquipAvatarItemDto {
  @IsIn(AVATAR_ITEM_TYPES)
  itemType!: (typeof AVATAR_ITEM_TYPES)[number];

  @IsUUID()
  itemId!: string;
}
