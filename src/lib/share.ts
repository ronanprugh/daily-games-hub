/**
 * Reading a game's own share text.
 *
 * Every one of these games has a Share / Copy button that produces a block of
 * text: a header, a number, usually a grid of emoji. Pasting that block is the
 * fastest way to log a result, so each game gets a parser for its format.
 *
 * Formats were taken from real shares in the group thread, not from
 * documentation — most of these games have none, and several do not mean what
 * they appear to:
 *
 *  - Poople `8/6` is 8 guesses against a par of 6, and still a solve.
 *  - Word500 `score = 7/8` is 7 guesses used, not 7 points.
 *  - Farflung `280/500 km` is POINTS out of 500; more Misses, lower total.
 *  - Plain `6,112 m` was "Top 10%", so higher is better.
 *  - Travle `+2` is a solve two over par; `(1 away)` is a miss.
 *
 * Pure: no database, no `next/*`. Each parser takes the whole pasted text and
 * returns the comparable number plus whether the puzzle was solved, or null
 * when the text is not that game's share.
 */

import { GAMES_BY_SLUG } from "../data/games";
import { parseScore } from "./stats";

export interface ParsedResult {
  score: number | null;
  solved: boolean;
}

type ShareParser = (text: string) => ParsedResult | null;

const num = (s: string): number => Number(s.replace(/,/g, ""));

/** `m:ss` or `h:mm:ss` to seconds. */
function clock(s: string): number {
  const parts = s.split(":").map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** `4/6` style: X means played and missed. */
function fraction(m: RegExpExecArray | null): ParsedResult | null {
  if (!m || m[1] === undefined) return null;
  if (/^x$/i.test(m[1])) return { score: null, solved: false };
  return { score: Number(m[1]), solved: true };
}

/** Coloured squares used by Connections, in order of appearance. */
const SQUARE = /🟨|🟩|🟦|🟪/gu;

/**
 * Connections: rows of four squares, one row per guess. A row of a single
 * colour is a correct group; anything else is a mistake. Solved means all
 * four groups were found. Read by chunking squares into fours rather than by
 * line, so a paste that lost its line breaks still parses.
 */
function connections(text: string): ParsedResult | null {
  const header = /Connections\s*Puzzle\s*#\d+/i.exec(text);
  if (!header) return null;
  const squares = text.slice(header.index + header[0].length).match(SQUARE) ?? [];
  if (squares.length === 0 || squares.length % 4 !== 0) return null;
  let correct = 0;
  let mistakes = 0;
  for (let i = 0; i < squares.length; i += 4) {
    const row = squares.slice(i, i + 4);
    if (row.every((sq) => sq === row[0])) correct += 1;
    else mistakes += 1;
  }
  return { score: mistakes, solved: correct === 4 };
}

export const SHARE_PARSERS: Record<string, ShareParser> = {
  wordle: (t) => fraction(/\bWordle\s+[\d,]+\s+([1-6X])\/6\*?/i.exec(t)),

  poople: (t) => {
    // "moves/par". Par is the puzzle's minimum and varies by day, so the raw
    // move count is not comparable across days; moves over par is.
    const m = /\bPoople\s+#\d+\s+(\d+)\/(\d+)/i.exec(t);
    return m ? { score: Number(m[1]) - Number(m[2]), solved: true } : null;
  },

  word500: (t) => {
    // A win is "score = 7/8"; a loss is "score = LOSS" (confirmed 2026-11-28 —
    // the X/8 this first assumed does not exist).
    const m = /\bWord500\b[\s\S]*?score\s*=\s*(?:(\d+)\s*\/\s*8|(LOSS))/i.exec(t);
    if (!m) return null;
    if (m[2]) return { score: null, solved: false };
    return { score: Number(m[1]), solved: true };
  },

  sedecordle: (t) => fraction(/\bSedecordle\b[^\n]*?#\d+\s+(\d+|X)\/21/i.exec(t)),

  "la-palabra-del-dia": (t) =>
    fraction(/La palabra del d[ií]a\s+#\d+\s+([1-6X])\/6/i.exec(t)),

  contexto: (t) => {
    const m = /contexto[\s\S]*?(?:got it in|in)\s+(\d+)\s+guess/i.exec(t);
    return m?.[1] ? { score: Number(m[1]), solved: true } : null;
  },

  globle: (t) => {
    if (!/globle|🌎[^\n]*\d{4}[^\n]*🌍/iu.test(t)) return null;
    const m = /=\s*(\d+)/.exec(t);
    return m?.[1] ? { score: Number(m[1]), solved: true } : null;
  },

  flagle: (t) => fraction(/#?Flagle\s+#\d+[^\n]*?\b([1-6X])\/6/i.exec(t)),

  worldle: (t) => fraction(/#?Worldle\s+#\d+[^\n]*?\b([1-6X])\/6/i.exec(t)),

  travle: (t) => {
    const head = /#travle\s+#\d+/i.exec(t);
    if (!head) return null;
    const rest = t.slice(head.index + head[0].length);
    const par = /^\s*\+(\d+)/.exec(rest);
    if (par?.[1]) return { score: Number(par[1]), solved: true };
    if (/^\s*\(\d+\s+away\)/i.test(rest)) return { score: null, solved: false };
    return null;
  },

  timeguessr: (t) => {
    const m = /TimeGuessr\s+#\d+\s*[—–-]\s*([\d,]+)\s*\/\s*50,?000/i.exec(t);
    return m?.[1] ? { score: num(m[1]), solved: true } : null;
  },

  farflung: (t) => {
    const m = /Farflung\s+#\d+\s*·?\s*(\d+)\s*\/\s*500/i.exec(t);
    return m?.[1] ? { score: Number(m[1]), solved: true } : null;
  },

  plain: (t) => {
    const m = /\bPlain\s+#\d+\s*(?:✈️|✈)?\s*([\d,]+)\s*m\b/iu.exec(t);
    return m?.[1] ? { score: num(m[1]), solved: true } : null;
  },

  "planetle-geogrid": (t) => {
    const m = /GeoGrid[\s\S]*?(\d+:\d{2}(?::\d{2})?)/i.exec(t);
    return m?.[1] ? { score: clock(m[1]), solved: !/❌/u.test(t) } : null;
  },

  "planetle-geozip": (t) => {
    const m = /GeoZip[\s\S]*?(\d+:\d{2}(?::\d{2})?)/i.exec(t);
    return m?.[1] ? { score: clock(m[1]), solved: !/❌/u.test(t) } : null;
  },

  "planetle-geodraft": (t) => {
    const m = /GeoDraft[\s\S]*?(?:Score:\s*([\d,]+)|([\d,]+)\s*pts)/i.exec(t);
    const v = m?.[1] ?? m?.[2];
    return v ? { score: num(v), solved: true } : null;
  },

  connections,

  "nyt-mini": (t) => {
    const m = /Mini Crossword in (\d+:\d{2}(?::\d{2})?)/i.exec(t);
    return m?.[1] ? { score: clock(m[1]), solved: true } : null;
  },

  "nyt-midi": (t) => {
    const m = /Midi Crossword in (\d+:\d{2}(?::\d{2})?)/i.exec(t);
    return m?.[1] ? { score: clock(m[1]), solved: true } : null;
  },

  "spelling-bee": (t) => {
    // Shared as a badge link: ...bee.html?d=...&p=130&r=Genius...
    const m = /bee\.html\?\S*?[?&]p=(\d+)/i.exec(t);
    return m?.[1] ? { score: Number(m[1]), solved: true } : null;
  },

  krillion: (t) => {
    const head = /Krillion\s+(?:∞\s*)?#\d+/i.exec(t);
    if (!head) return null;
    // The score is the first standalone number after the header.
    const m = /(?:^|\s)(\d[\d,]*)(?=\s|$)/.exec(t.slice(head.index + head[0].length));
    return m?.[1] ? { score: num(m[1]), solved: true } : null;
  },
};

/**
 * Games with no share format seen in practice. They take a typed score only.
 * Listed explicitly so a new game cannot silently ship without a parser —
 * share.test.ts checks every catalogue slug is in exactly one of the two.
 */
export const NO_SHARE_FORMAT = new Set(["tightrope"]);

/** Which game a pasted share belongs to, if any parser recognises it. */
export function detectGame(text: string): string | null {
  for (const [slug, parse] of Object.entries(SHARE_PARSERS)) {
    if (parse(text) !== null) return slug;
  }
  return null;
}

/** Pasted text is capped: a share is a few hundred characters at most. */
export const MAX_RAW_LENGTH = 2000;

/**
 * Turns whatever was pasted or typed into a result for `slug`.
 *
 * Tries the game's own share format first, then the short typed forms
 * (`4/6`, `0:24`, `+2`, `360`). When neither fits but the text IS some other
 * game's share, says which — pasting a Krillion result into the Wordle box is
 * the commonest way this goes wrong, and "could not read" would not say so.
 */
export function parseEntry(
  slug: string,
  raw: string,
): { result: ParsedResult } | { error: string } {
  const game = GAMES_BY_SLUG.get(slug);
  if (!game) return { error: "Unknown game." };
  const text = raw.replace(/\r\n?/g, "\n").trim();
  if (text.length > MAX_RAW_LENGTH) return { error: "That is too long to be a score." };

  const fromShare = SHARE_PARSERS[slug]?.(text);
  if (fromShare) return { result: fromShare };

  const typed = parseScore(game.scoring, text);
  if (typed) return { result: typed };

  const other = detectGame(text);
  if (other && other !== slug) {
    const name = GAMES_BY_SLUG.get(other)?.name ?? other;
    return { error: `That looks like a ${name} share. Paste it under ${name}.` };
  }
  return {
    error: `Could not read that as a ${game.name} score. Paste the share text, or type the score.`,
  };
}

/** Emoji, including keycap digits (`1️⃣` ends in U+20E3). */
const EMOJI = /[\p{Extended_Pictographic}⃣]/u;

/**
 * The emoji grid out of a pasted share: every line after the header that
 * carries an emoji, minus links. Null for a typed score with no grid.
 *
 * Best-effort, for display — `raw` keeps the whole paste, so nothing that
 * this drops is lost.
 */
export function extractBoard(text: string): string | null {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").slice(1);
  const kept = lines
    .filter((line) => EMOJI.test(line) && !/https?:\/\//i.test(line))
    // A line with words in it is a caption ("Can you beat me? 👇",
    // "🔥 2-day streak"), not board — unless it is a numbered round row,
    // which is how TimeGuessr lays out its board ("1️⃣ 🏆6,779 · 📅 1y").
    .filter((line) => !/[A-Za-z]{2,}/.test(line) || /^\s*\d\uFE0F?\u20E3/u.test(line))
    .map((line) => line.trimEnd());
  return kept.length > 0 ? kept.join("\n") : null;
}
