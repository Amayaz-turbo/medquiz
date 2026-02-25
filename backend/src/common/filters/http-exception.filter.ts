import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId =
      (request.headers["x-request-id"] as string | undefined) ??
      randomUUID();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === "string") {
        message = responseBody;
      } else if (typeof responseBody === "object" && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        if (typeof body.message === "string") {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          const messages = body.message.filter((item): item is string => typeof item === "string");
          if (messages.length > 0) {
            message = messages.join("; ");
          }
        }
        details = body["details"];
        if (typeof body["code"] === "string") {
          code = body["code"];
        } else {
          code = this.defaultCodeForStatus(statusCode);
        }
      }
    }

    response.status(statusCode).send({
      error: {
        code,
        message,
        details,
        requestId
      }
    });
  }

  private defaultCodeForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return "VALIDATION_ERROR";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "BUSINESS_RULE_VIOLATION";
      case HttpStatus.TOO_MANY_REQUESTS:
        return "RATE_LIMITED";
      case HttpStatus.SERVICE_UNAVAILABLE:
        return "SERVICE_UNAVAILABLE";
      default:
        return "INTERNAL_ERROR";
    }
  }
}
