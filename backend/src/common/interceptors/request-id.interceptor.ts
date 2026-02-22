import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { Observable } from "rxjs";
import { randomUUID } from "node:crypto";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const res = http.getResponse<FastifyReply>();

    const requestId =
      (req.headers["x-request-id"] as string | undefined) ?? randomUUID();

    req.headers["x-request-id"] = requestId;
    res.header("x-request-id", requestId);

    return next.handle();
  }
}
