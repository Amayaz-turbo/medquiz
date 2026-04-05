import { Module } from "@nestjs/common";
import { DuelsModule } from "../duels/duels.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [DuelsModule],
  controllers: [DemoController],
  providers: [DemoService]
})
export class DemoModule {}
