import "server-only";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// HTTP driver: one request per query, no connection pool to manage on serverless.
// Multi-step writes go through Postgres functions (see db/migrations) so they stay atomic.
export const sql = neon(url);
