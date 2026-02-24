import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string
  ) {
    const result = await this.notificationsService.listNotifications(user.userId, {
      status,
      limit,
      cursor
    });
    return { data: result };
  }

  @Post(":notificationId/read")
  async markNotificationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("notificationId", new ParseUUIDPipe({ version: "4" })) notificationId: string
  ) {
    const result = await this.notificationsService.markNotificationRead(user.userId, notificationId);
    return { data: result };
  }
}
