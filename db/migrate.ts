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

/**
 * Pre-flight: refuse to touch a database that already holds a table of the
 * same name but a different shape.
 *
 * `CREATE TABLE IF NOT EXISTS` treats ANY existing table of that name as
 * success. Pointed at another app's database, it skipped our `users` because
 * that app already had one, reported "ok", and then created `sessions` and
 * `entries` beside the stranger's tables. Nothing errored until sign-up asked
 * for a column the foreign `users` table never had.
 *
 * So every table this schema owns is checked BEFORE anything is created. A
 * missing table is fine — that is the first-run case. A present table missing
 * one of our columns stops the run with nothing applied.
 */
const EXPECTED: Record<string, string[]> = {
  users: ["id", "username", "username_ci", "password", "created_at"],
  sessions: ["token_hash", "user_id", "created_at", "expires_at"],
  entries: [
    "id",
    "user_id",
    "game_slug",
    "played_on",
    "solved",
    "score",
    "raw",
    "created_at",
    "updated_at",
  ],
};

const problems: string[] = [];
for (const [table, wanted] of Object.entries(EXPECTED)) {
  const cols = (await sql.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = $1`,
    [table],
  )) as { column_name: string }[];
  if (cols.length === 0) continue; // absent: will be created
  const have = new Set(cols.map((c) => c.column_name));
  const missing = wanted.filter((c) => !have.has(c));
  if (missing.length > 0) {
    problems.push(
      `  ${table}: exists but lacks ${missing.join(", ")} ` +
        `(has ${[...have].sort().join(", ")})`,
    );
  }
}
if (problems.length > 0) {
  console.error(
    "Refusing to migrate: this database already has tables with these names\n" +
      "but a different shape. It is very likely another app's database.\n\n" +
      problems.join("\n") +
      "\n\nNothing was applied. Point DATABASE_URL at a dedicated database.",
  );
  process.exit(1);
}
console.log("pre-flight: no conflicting tables");

for (const statement of statements) {
  const label = statement.split("\n")[0]?.slice(0, 70) ?? "";
  await sql.query(statement);
  console.log("ok:", label);
}
console.log(`\napplied ${statements.length} statements`);
