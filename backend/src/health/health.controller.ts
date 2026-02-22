import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { env } from "../config/env";
import { DatabaseService } from "../database/database.service";
import { MetricsService } from "../observability/metrics.service";

@Controller("health")
export class HealthController {
  private readonly cfg = env();

  constructor(
    private readonly db: DatabaseService,
    private readonly metrics: MetricsService
  ) {}

  @Get("live")
  getLiveness(): { data: { status: string; uptimeSeconds: number; timestamp: string } } {
    return {
      data: {
        status: "ok",
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get("ready")
  async getReadiness(): Promise<{
    data: { status: string; database: string; uptimeSeconds: number; timestamp: string };
  }> {
    const databaseReady = await this.isDatabaseReady();
    this.metrics.setDependencyStatus("database", databaseReady);
    if (!databaseReady) {
      throw new ServiceUnavailableException({
        code: "SERVICE_NOT_READY",
        message: "Database check failed"
      });
    }

    return {
      data: {
        status: "ok",
        database: "ok",
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get()
  async getHealth(): Promise<{
    data: { status: string; database: string; uptimeSeconds: number; timestamp: string };
  }> {
    return this.getReadiness();
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.withTimeout(this.db.query("SELECT 1"), this.cfg.healthDbTimeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
