"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "../lib/db";
import { createSession, currentUser, destroySession } from "../lib/auth";
import { hashPassword, validateCredentials, verifyPassword } from "../lib/password";
import { GAMES_BY_SLUG } from "../data/games";
import { parseScore } from "../lib/stats";

export interface ActionResult {
  error?: string;
}

export async function signUp(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "").trim();

  const invalid = validateCredentials(username, password);
  if (invalid) return { error: invalid };

  // When SIGNUP_CODE is set, the hub is invite-only. It is a public URL, so
  // without this anyone who finds it can create an account.
  const required = process.env["SIGNUP_CODE"];
  if (required && code !== required) return { error: "That invite code is not right." };

  const ci = username.toLowerCase();
  const existing = (await sql()`
    SELECT 1 FROM users WHERE username_ci = ${ci} LIMIT 1
  `) as unknown[];
  if (existing.length > 0) return { error: "That username is taken." };

  const rows = (await sql()`
    INSERT INTO users (username, username_ci, password)
    VALUES (${username}, ${ci}, ${await hashPassword(password)})
    RETURNING id
  `) as { id: number }[];

  const id = rows[0]?.id;
  if (id === undefined) return { error: "Could not create that account." };
  await createSession(id);
  redirect("/");
}

export async function signIn(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (username === "" || password === "") {
    return { error: "Enter a username and password." };
  }

  const rows = (await sql()`
    SELECT id, password FROM users WHERE username_ci = ${username.toLowerCase()} LIMIT 1
  `) as { id: number; password: string }[];

  const user = rows[0];
  // Deliberately the same message for "no such user" and "wrong password":
  // telling them apart hands out a list of who has an account.
  const WRONG = { error: "Username or password is not right." };
  if (!user) {
    // Still spend the time a real verification would, so the response time
    // does not reveal whether the username exists.
    await verifyPassword(password, "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
    return WRONG;
  }
  if (!(await verifyPassword(password, user.password))) return WRONG;

  await createSession(user.id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/**
 * Records (or corrects) one day's result.
 *
 * Upserts on (user, game, day), so pressing save twice edits rather than
 * duplicating — which is what makes the unique constraint the source of
 * truth for "did I play today".
 */
export async function saveEntry(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { error: "You are signed out. Sign in and try again." };

  const slug = String(form.get("slug") ?? "");
  const day = String(form.get("day") ?? "");
  const raw = String(form.get("score") ?? "");

  const game = GAMES_BY_SLUG.get(slug);
  if (!game) return { error: "Unknown game." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: "Bad date." };

  const parsed = parseScore(game.scoring, raw);
  if (!parsed) return { error: `Could not read "${raw}" as a score for ${game.name}.` };

  await sql()`
    INSERT INTO entries (user_id, game_slug, played_on, solved, score, raw)
    VALUES (${user.id}, ${slug}, ${day}, ${parsed.solved}, ${parsed.score}, ${raw})
    ON CONFLICT (user_id, game_slug, played_on) DO UPDATE
       SET solved = EXCLUDED.solved,
           score = EXCLUDED.score,
           raw = EXCLUDED.raw,
           updated_at = now()
  `;
  revalidatePath("/");
  return {};
}

export async function clearEntry(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { error: "You are signed out." };
  const slug = String(form.get("slug") ?? "");
  const day = String(form.get("day") ?? "");
  await sql()`
    DELETE FROM entries
     WHERE user_id = ${user.id} AND game_slug = ${slug} AND played_on = ${day}
  `;
  revalidatePath("/");
  return {};
}
