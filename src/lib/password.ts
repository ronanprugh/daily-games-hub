import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * `promisify` picks the 3-argument overload, which drops the options we need
 * to set the cost parameters. Re-declared with the signature we actually use.
 */
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * scrypt parameters.
 *
 * N=2^15 with r=8 needs ~33 MB per hash, which is over Node's default 32 MB
 * `maxmem` — hence the explicit ceiling. These are deliberately costly: the
 * whole point of a memory-hard KDF is that a stolen `users` table is not a
 * list of passwords.
 */
const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  const parts = ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")];
  return parts.join("$");
}

/**
 * Checks a password against a stored hash.
 *
 * Compared with `timingSafeEqual`, not `===`: a byte-by-byte comparison that
 * bails on the first mismatch leaks how much of the hash was right.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] as string, "base64");
  const expected = Buffer.from(parts[5] as string, "base64");
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const actual = await scrypt(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: MAXMEM,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

/** Returns an error message, or null when the credentials are acceptable. */
export function validateCredentials(username: string, password: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "Username must be 3-32 characters: letters, numbers, _ or - only.";
  }
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password must be under 200 characters.";
  return null;
}
