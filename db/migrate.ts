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

// Strip line comments BEFORE splitting. Filtering chunks that merely START
// with a comment silently drops the statement attached to it — which is how
// the first run lost CREATE TABLE users to this file's own header, and then
// failed on sessions referencing a table that was never created.
const withoutComments = schema
  .split("\n")
  .filter((line) => !/^\s*--/.test(line))
  .join("\n");

const statements = withoutComments
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s !== "");

const sql = neon(url);
for (const statement of statements) {
  const label = statement.split("\n")[0]?.slice(0, 70) ?? "";
  await sql.query(statement);
  console.log("ok:", label);
}
console.log(`\napplied ${statements.length} statements`);
