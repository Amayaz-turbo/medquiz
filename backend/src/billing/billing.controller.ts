import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { BillingService } from "./billing.service";
import { CreateCheckoutSessionDto } from "./dto/create-checkout-session.dto";

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("subscription")
  async getCurrentSubscription(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.billingService.getCurrentSubscription(user.userId);
    return { data: result };
  }

  @Post("checkout-session")
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckoutSessionDto
  ) {
    const result = await this.billingService.createCheckoutSession(user.userId, dto);
    return { data: result };
  }
}
