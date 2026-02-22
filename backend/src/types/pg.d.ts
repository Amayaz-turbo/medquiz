declare module "pg" {
  export type QueryResultRow = Record<string, unknown>;

  export interface QueryResult<R = unknown> {
    rows: R[];
    rowCount: number;
  }

  export class PoolClient {
    query<R = unknown>(
      text: string,
      values?: readonly unknown[] | unknown[]
    ): Promise<QueryResult<R>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: Record<string, unknown>);
    query<R = unknown>(
      text: string,
      values?: readonly unknown[] | unknown[]
    ): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }

  export class Client {
    constructor(config?: Record<string, unknown>);
    connect(): Promise<void>;
    query<R = unknown>(
      text: string,
      values?: readonly unknown[] | unknown[]
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
