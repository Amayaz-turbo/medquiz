import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { HttpTelemetryInterceptor } from "./http-telemetry.interceptor";
import { MetricsService } from "./metrics.service";
import { ObservabilityController } from "./observability.controller";

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    MetricsService,
    HttpTelemetryInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: HttpTelemetryInterceptor
    }
  ],
  exports: [MetricsService]
})
export class ObservabilityModule {}
