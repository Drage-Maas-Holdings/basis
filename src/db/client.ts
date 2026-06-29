import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please set it to the absolute path of your SQLite file (e.g., /data/basis.db)."
  );
}

const sqlite = new Database(databaseUrl);
export const db = drizzle(sqlite, { schema });
