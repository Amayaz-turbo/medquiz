import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { AdsService } from "./ads.service";
import { AdsEligibilityQueryDto } from "./dto/ads-eligibility-query.dto";
import { CreateAdImpressionDto } from "./dto/create-ad-impression.dto";
import { CreateRewardGrantDto } from "./dto/create-reward-grant.dto";

@Controller("ads")
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get("eligibility")
  async getEligibility(@CurrentUser() user: AuthenticatedUser, @Query() query: AdsEligibilityQueryDto) {
    const result = await this.adsService.getEligibility(user.userId, query);
    return { data: result };
  }

  @Post("impressions")
  async createImpression(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdImpressionDto) {
    const result = await this.adsService.createImpression(user.userId, dto);
    return { data: result };
  }

  @Post("reward-grants")
  async createRewardGrant(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRewardGrantDto) {
    const result = await this.adsService.createRewardGrant(user.userId, dto);
    return { data: result };
  }
}
