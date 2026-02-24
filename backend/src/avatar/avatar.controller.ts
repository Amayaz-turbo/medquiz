import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { AvatarService } from "./avatar.service";
import { ListAvatarInventoryDto } from "./dto/list-avatar-inventory.dto";
import { EquipAvatarItemDto } from "./dto/equip-avatar-item.dto";
import { SetAvatarSpecialtyDto } from "./dto/set-avatar-specialty.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get("avatar/stages")
  async listAvatarStages() {
    const result = await this.avatarService.listAvatarStages();
    return { data: result };
  }

  @Get("avatar/specialties")
  async listMedicalSpecialties() {
    const result = await this.avatarService.listMedicalSpecialties();
    return { data: result };
  }

  @Get("me/avatar")
  async getMyAvatarState(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.avatarService.getMyAvatarState(user.userId);
    return { data: result };
  }

  @Get("me/avatar/inventory")
  async getMyAvatarInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAvatarInventoryDto
  ) {
    const result = await this.avatarService.getMyAvatarInventory(user.userId, query.itemType);
    return { data: result };
  }

  @Post("me/avatar/equipment")
  async equipMyAvatarItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: EquipAvatarItemDto) {
    const result = await this.avatarService.equipMyAvatarItem(user.userId, dto);
    return { data: result };
  }

  @Post("me/avatar/specialty")
  async setMyAvatarSpecialty(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetAvatarSpecialtyDto) {
    const result = await this.avatarService.setMyAvatarSpecialty(user.userId, dto);
    return { data: result };
  }
}
