import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { env } from "../config/env";
import { NotificationPushDispatchService } from "./notification-push-dispatch.service";

@Injectable()
export class NotificationPushWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationPushWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly dispatchService: NotificationPushDispatchService) {}

  onModuleInit(): void {
    const cfg = env();
    if (!cfg.pushNotificationsJobEnabled) {
      this.logger.log("push notifications worker disabled by config");
      return;
    }

    const intervalSeconds = cfg.pushNotificationsIntervalSeconds;
    const intervalMs = intervalSeconds * 1000;
    this.logger.log(
      `push notifications worker started (interval=${intervalSeconds}s, batch=${cfg.pushNotificationsBatchSize})`
    );

    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);

    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const result = await this.dispatchService.dispatchPending();
      if (result.processed > 0) {
        this.logger.log(
          `push notifications tick processed=${result.processed}, sent=${result.sent}, failed=${result.failed}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`push notifications tick failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
