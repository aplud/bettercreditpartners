import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export const hasDatabase = !!process.env.DATABASE_URL;

export const pool: Pool | null = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const _db: NodePgDatabase<typeof schema> | null = pool ? drizzle(pool, { schema }) : null;

/** Non-null db accessor — only call when hasDatabase is true (i.e. inside DatabaseStorage / guarded routes) */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) throw new Error("Database not available — DATABASE_URL is not set");
  return _db;
}

/** @deprecated use getDb() for type-safe access */
export const db = _db;
