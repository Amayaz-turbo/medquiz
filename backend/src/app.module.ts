import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { env } from "./config/env";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { TrainingsModule } from "./trainings/trainings.module";
import { DuelsModule } from "./duels/duels.module";
import { MeModule } from "./me/me.module";
import { ObservabilityModule } from "./observability/observability.module";
import { AvatarModule } from "./avatar/avatar.module";

const cfg = env();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: cfg.accessTokenSecret
    }),
    DatabaseModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    MeModule,
    AvatarModule,
    TrainingsModule,
    DuelsModule
  ]
})
export class AppModule {}
