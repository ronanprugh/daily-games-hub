import { neon } from "@neondatabase/serverless";

/**
 * The database handle.
 *
 * Read lazily rather than at module load: importing this file must not throw
 * during `next build`, which runs without the runtime environment.
 */
export function sql() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a Postgres store (Vercel → Storage → " +
        "Neon) and connect it to this project, or copy the connection string " +
        "into .env.local for local development.",
    );
  }
  return neon(url);
}
