// Applies every file in db/migrations that has not run yet, in name order.
// Usage: npm run db:migrate   (reads DATABASE_URL from .env.local)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.resolve("db/migrations");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
)`);

const { rows } = await client.query("select name from schema_migrations");
const applied = new Set(rows.map((r) => r.name));
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const text = await readFile(path.join(dir, file), "utf8");
  process.stdout.write(`Applying ${file}... `);
  try {
    await client.query("begin");
    await client.query(text);
    await client.query("insert into schema_migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log("done");
  } catch (error) {
    await client.query("rollback");
    console.error("failed");
    console.error(error.message);
    process.exitCode = 1;
    break;
  }
}

await client.end();
