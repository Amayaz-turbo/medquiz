import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { env } from "../config/env";
import { DuelsService } from "./duels.service";

@Injectable()
export class DuelExpirationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DuelExpirationWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly duelsService: DuelsService) {}

  onModuleInit(): void {
    const cfg = env();
    if (!cfg.duelExpirationJobEnabled) {
      this.logger.log("duel expiration worker disabled by config");
      return;
    }

    const intervalMs = cfg.duelExpirationIntervalSeconds * 1000;
    this.logger.log(`duel expiration worker started (interval=${cfg.duelExpirationIntervalSeconds}s)`);

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
      const result = await this.duelsService.expireDueTurns(100);
      if (result.processed > 0) {
        this.logger.log(
          `duel expiration tick processed=${result.processed}, skippedNoRound=${result.skippedNoRound}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`duel expiration tick failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
