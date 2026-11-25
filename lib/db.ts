import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

// Anything with a query method works: a pg Pool in the site, an in-memory Postgres in the unit tests.
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

let pool: Pool | undefined;
let override: Db | undefined;

export function getDb(): Db {
  if (override) return override;
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Chapter 4.4 shows how to set it in .env.local.");
    }
    pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 3000 });
    // A dropped idle connection must never crash the server.
    pool.on("error", () => {});
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}

// Used by the unit tests only.
export function setDbForTests(db: Db | undefined): void {
  override = db;
}
