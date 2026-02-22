import { Module } from "@nestjs/common";
import { DuelsController } from "./duels.controller";
import { DuelExpirationWorker } from "./duel-expiration.worker";
import { DuelsService } from "./duels.service";

@Module({
  controllers: [DuelsController],
  providers: [DuelsService, DuelExpirationWorker]
})
export class DuelsModule {}
