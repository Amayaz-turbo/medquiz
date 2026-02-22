import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { MetricsService } from "./metrics.service";

@Controller("observability")
export class ObservabilityController {
  private readonly cfg = env();

  constructor(private readonly metrics: MetricsService) {}

  @Get("metrics")
  getMetrics(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ): string {
    this.assertEnabled();
    this.assertAuthorized(req);
    res.header("content-type", "text/plain; version=0.0.4; charset=utf-8");
    return this.metrics.renderPrometheus();
  }

  @Get("slo")
  getSlo(@Req() req: FastifyRequest) {
    this.assertEnabled();
    this.assertAuthorized(req);
    return {
      data: this.metrics.getSloSnapshot()
    };
  }

  private assertEnabled(): void {
    if (!this.cfg.metricsEnabled) {
      throw new NotFoundException({
        code: "METRICS_DISABLED",
        message: "Observability endpoints are disabled"
      });
    }
  }

  private assertAuthorized(req: FastifyRequest): void {
    const expected = this.cfg.metricsAuthToken;
    if (!expected) {
      return;
    }

    const provided = this.extractProvidedToken(req);

    if (!provided || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException({
        code: "METRICS_UNAUTHORIZED",
        message: "Metrics endpoint requires valid token"
      });
    }
  }

  private extractProvidedToken(req: FastifyRequest): string | null {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      return authHeader.slice("Bearer ".length).trim();
    }

    const legacyHeader = req.headers["x-metrics-token"];
    if (typeof legacyHeader === "string") {
      return legacyHeader.trim();
    }
    return null;
  }

  private safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) {
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  }
}
