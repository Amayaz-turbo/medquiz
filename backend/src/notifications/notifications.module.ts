import { Module } from "@nestjs/common";
import { NotificationPushDispatchService } from "./notification-push-dispatch.service";
import { NotificationPushWorker } from "./notification-push.worker";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationPushDispatchService, NotificationPushWorker]
})
export class NotificationsModule {}
