import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const sql = neon(connectionString);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development" && process.env.DB_LOG === "1",
});

export type Db = typeof db;
