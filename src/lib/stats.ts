import { GAMES_BY_SLUG, lowerIsBetter, type Scoring } from "../data/games";

export interface EntryRow {
  game_slug: string;
  /** ISO date, `YYYY-MM-DD`. */
  played_on: string;
  solved: boolean;
  score: number | null;
}

export interface GameStats {
  slug: string;
  plays: number;
  solves: number;
  /** Solves as a fraction of plays, or null when nothing has been played. */
  solveRate: number | null;
  /** Best score by the game's own direction, over SOLVED plays only. */
  best: number | null;
  average: number | null;
  currentStreak: number;
  longestStreak: number;
  lastPlayed: string | null;
}

/** `YYYY-MM-DD` for a date, in local terms rather than UTC. */
export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayBefore(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return isoDay(date);
}

/**
 * Counts back from `today` over a set of played days.
 *
 * A streak that has not been extended TODAY is not broken — the day is not
 * over. So a streak ending yesterday still counts, and only a gap of two or
 * more days ends it. Getting this wrong would punish someone for opening the
 * page before they had played.
 */
export function currentStreak(days: Set<string>, today: string): number {
  let cursor = days.has(today) ? today : dayBefore(today);
  if (!days.has(cursor)) return 0;
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = dayBefore(cursor);
  }
  return n;
}

export function longestStreak(days: Set<string>): number {
  let best = 0;
  for (const day of days) {
    // Only count from the START of a run, so each run is walked once.
    if (days.has(dayBefore(day))) continue;
    let n = 0;
    let cursor = day;
    while (days.has(cursor)) {
      n += 1;
      const [y, m, d] = cursor.split("-").map(Number) as [number, number, number];
      const next = new Date(y, m - 1, d);
      next.setDate(next.getDate() + 1);
      cursor = isoDay(next);
    }
    if (n > best) best = n;
  }
  return best;
}

function betterOf(scoring: Scoring, a: number, b: number): number {
  return lowerIsBetter(scoring) ? Math.min(a, b) : Math.max(a, b);
}

export function statsForGame(slug: string, rows: EntryRow[], today: string): GameStats {
  const mine = rows.filter((r) => r.game_slug === slug);
  const game = GAMES_BY_SLUG.get(slug);
  const days = new Set(mine.map((r) => r.played_on));
  const solvedScores = mine
    .filter((r) => r.solved && r.score !== null)
    .map((r) => r.score as number);

  let best: number | null = null;
  if (game && solvedScores.length > 0) {
    best = solvedScores.reduce((acc, s) => betterOf(game.scoring, acc, s));
  }

  const sorted = [...days].sort();
  return {
    slug,
    plays: mine.length,
    solves: mine.filter((r) => r.solved).length,
    solveRate:
      mine.length === 0 ? null : mine.filter((r) => r.solved).length / mine.length,
    best,
    average:
      solvedScores.length === 0
        ? null
        : solvedScores.reduce((a, b) => a + b, 0) / solvedScores.length,
    currentStreak: currentStreak(days, today),
    longestStreak: longestStreak(days),
    lastPlayed: sorted[sorted.length - 1] ?? null,
  };
}

export interface OverallStats {
  totalPlays: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  /** Games played at least once. */
  gamesPlayed: number;
}

export function overallStats(rows: EntryRow[], today: string): OverallStats {
  const days = new Set(rows.map((r) => r.played_on));
  return {
    totalPlays: rows.length,
    daysActive: days.size,
    currentStreak: currentStreak(days, today),
    longestStreak: longestStreak(days),
    gamesPlayed: new Set(rows.map((r) => r.game_slug)).size,
  };
}

/**
 * Turns what the user typed into the comparable number for that game.
 *
 * Accepts the shapes people actually paste: `4/6`, `X/6`, `+2`, `0:24`,
 * `32,741`, `280 km`. Returns `solved: false` for an X, which is a play that
 * did not land rather than an absent day.
 */
export function parseScore(
  scoring: Scoring,
  raw: string,
): { score: number | null; solved: boolean } | null {
  const text = raw.trim();
  if (text === "") return scoring.kind === "done" ? { score: null, solved: true } : null;

  if (/^x$/i.test(text) || /^x\s*\/\s*\d+$/i.test(text)) {
    return { score: null, solved: false };
  }

  switch (scoring.kind) {
    case "done":
      return { score: null, solved: !/^(no|n|false)$/i.test(text) };
    case "time": {
      const clock = /^(\d+):([0-5]?\d)$/.exec(text);
      if (clock) {
        return {
          score: Number(clock[1]) * 60 + Number(clock[2]),
          solved: true,
        };
      }
      const secs = Number(text.replace(/[^\d.]/g, ""));
      return Number.isFinite(secs) ? { score: secs, solved: true } : null;
    }
    case "par": {
      // Whole string only: "8/6" must not be read as 8 over par.
      const m = /^\+?(-?\d+)$/.exec(text);
      return m ? { score: Number(m[1]), solved: true } : null;
    }
    case "guesses":
    case "mistakes": {
      const m = /^(\d+)\s*(?:\/\s*\d+)?$/.exec(text);
      return m ? { score: Number(m[1]), solved: true } : null;
    }
    case "points": {
      const m = /^([\d,]+(?:\.\d+)?)/.exec(text);
      if (!m) return null;
      const n = Number((m[1] as string).replace(/,/g, ""));
      return Number.isFinite(n) ? { score: n, solved: true } : null;
    }
  }
}
