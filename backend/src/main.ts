import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import helmet from "@fastify/helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  const cfg = env();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  app.setGlobalPrefix("v1");
  app.enableCors({
    origin:
      cfg.corsOrigins.length > 0
        ? (origin, cb) => {
            if (!origin || cfg.corsOrigins.includes(origin)) {
              cb(null, true);
              return;
            }
            cb(new Error("CORS origin not allowed"), false);
          }
        : true,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  await app.listen(cfg.port, "0.0.0.0");
}

void bootstrap();
