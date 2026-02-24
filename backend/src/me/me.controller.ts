import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { MeService } from "./me.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateProfileCustomizationDto } from "./dto/update-profile-customization.dto";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const me = await this.meService.getMe(user.userId, user.email);
    return {
      data: me
    };
  }

  @Patch("profile")
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const me = await this.meService.updateProfile(user.userId, dto, user.email);
    return {
      data: me
    };
  }

  @Patch("profile/customization")
  async updateProfileCustomization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileCustomizationDto
  ) {
    const me = await this.meService.updateProfileCustomization(user.userId, dto, user.email);
    return {
      data: me
    };
  }
}
