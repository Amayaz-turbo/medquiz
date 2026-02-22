import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { Observable } from "rxjs";
import { MetricsService } from "./metrics.service";

type FastifyRequestWithRoute = FastifyRequest & {
  routeOptions?: {
    url?: string;
  };
  user?: {
    userId?: string;
  };
};

@Injectable()
export class HttpTelemetryInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequestWithRoute>();
    const res = http.getResponse<FastifyReply>();
    const startedAt = process.hrtime.bigint();

    this.metrics.incrementInFlightRequests();

    let recorded = false;
    const onFinish = () => {
      if (recorded) {
        return;
      }
      recorded = true;
      this.metrics.decrementInFlightRequests();

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const route = this.resolveRoute(req);
      const statusCode = res.statusCode;
      this.metrics.observeHttpRequest({
        method: req.method,
        route,
        statusCode,
        durationMs
      });

      const requestId = this.requestId(req);
      req.log.info(
        {
          event: "http_request_completed",
          requestId,
          method: req.method,
          route,
          path: req.url,
          statusCode,
          durationMs: this.round(durationMs, 2),
          userId: req.user?.userId ?? null
        },
        "http_request_completed"
      );
    };

    res.raw.once("finish", onFinish);
    res.raw.once("close", onFinish);
    return next.handle();
  }

  private resolveRoute(req: FastifyRequestWithRoute): string {
    const declaredRoute = req.routeOptions?.url;
    if (typeof declaredRoute === "string" && declaredRoute.length > 0) {
      return declaredRoute;
    }

    const path = req.url.split("?")[0] ?? req.url;
    if (!path || path.trim().length === 0) {
      return "/unknown";
    }
    return path;
  }

  private requestId(req: FastifyRequest): string {
    const header = req.headers["x-request-id"];
    if (typeof header === "string" && header.length > 0) {
      return header;
    }
    return randomUUID();
  }

  private round(value: number, fractionDigits: number): number {
    const factor = 10 ** fractionDigits;
    return Math.round(value * factor) / factor;
  }
}
