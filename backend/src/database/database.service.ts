import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult } from "pg";
import { env } from "../config/env";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    const cfg = env();
    this.pool = new Pool({
      connectionString: cfg.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async query<T>(text: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values as unknown[]);
  }

  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log("Closing PostgreSQL pool");
    await this.pool.end();
  }
}
