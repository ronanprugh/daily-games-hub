/**
 * Applies db/schema.sql.
 *
 * Every statement is `IF NOT EXISTS`, so this is safe to re-run; it is a
 * bootstrap rather than a migration framework. When the schema starts needing
 * real versioned changes, this is the thing to replace.
 *
 * Run: DATABASE_URL=... pnpm db:migrate
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "schema.sql"), "utf8");

// Split on semicolons at end of line: the neon driver's tagged-template API
// runs one statement at a time.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s !== "" && !s.startsWith("--"));

const sql = neon(url);
for (const statement of statements) {
  const label = statement.split("\n")[0]?.slice(0, 70) ?? "";
  await sql.query(statement);
  console.log("ok:", label);
}
console.log(`\napplied ${statements.length} statements`);
