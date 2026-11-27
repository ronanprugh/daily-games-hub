import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

export const SESSION_COOKIE = "dgh_session";
const SESSION_DAYS = 30;

/** The cookie carries the token; the database only ever sees its hash. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql()`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expires.toISOString()})
  `;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export interface SessionUser {
  id: number;
  username: string;
}

/** The signed-in user, or null. An expired session is treated as absent. */
export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = (await sql()`
    SELECT u.id, u.username
      FROM sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ${hashToken(token)}
       AND s.expires_at > now()
     LIMIT 1
  `) as { id: number; username: string }[];
  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}
