/**
 * The games this hub tracks.
 *
 * Derived from what is ACTUALLY played in the "gaymer stim kittens" thread
 * (2026-11-12 onwards), not from a generic list of daily puzzles. Every URL
 * here was verified to return 200; the ones marked `seenInChat` were pasted by
 * a player rather than looked up, so they are the links people really use.
 *
 * `scoring` matters more than it looks. These games do not share a scale: a
 * Wordle is 1-6 where lower is better, a Krillion is 0-700 where higher is
 * better, and a Mini is a clock. Storing every result as a bare string would
 * make "my stats" impossible to compute, so each game declares how to read its
 * number.
 */

export type Scoring =
  /** Guesses used, out of `max`. Lower is better. X = failed. */
  | { kind: "guesses"; max: number }
  /** Raw points, out of `max` when the game has a ceiling. Higher is better. */
  | { kind: "points"; max?: number; unit?: string }
  /** Completion time. Lower is better. Stored as seconds. */
  | { kind: "time" }
  /** Moves over par, as travle's `+2`. Lower is better; 0 is perfect. */
  | { kind: "par" }
  /** Mistakes made, out of `max`. Lower is better. */
  | { kind: "mistakes"; max: number }
  /** No number worth keeping — just whether it got done. */
  | { kind: "done" };

export interface Game {
  slug: string;
  name: string;
  url: string;
  /** Loose grouping, used only to section the hub. */
  category: "word" | "geo" | "trivia" | "nyt" | "other";
  scoring: Scoring;
  /**
   * The best result anyone could post: 1 guess, 0 mistakes, 700 points.
   * Null when there is no ceiling worth stating (a crossword time, a Spelling
   * Bee total that changes daily).
   */
  bestPoints: number | null;
  /**
   * True when BOTH the share format and what its number means are confirmed.
   * False marks a game whose direction or meaning was inferred from a handful
   * of shares rather than known — the ones to check before trusting "best".
   */
  verified: boolean;
  /** True when a player pasted this exact link in the thread. */
  seenInChat: boolean;
  /** Posts seen in the thread 2026-11-12 → 2026-11-27, for ordering. */
  threadPosts: number;
  note?: string;
}

export const GAMES: Game[] = [
  // ---- word -------------------------------------------------------------
  {
    slug: "wordle",
    name: "Wordle",
    url: "https://www.nytimes.com/games/wordle",
    category: "nyt",
    scoring: { kind: "guesses", max: 6 },
    bestPoints: 1,
    verified: true,
    seenInChat: false,
    threadPosts: 46,
  },
  {
    slug: "word500",
    name: "Word500",
    url: "https://www.word500.com",
    category: "word",
    scoring: { kind: "guesses", max: 8 },
    bestPoints: 1,
    verified: false,
    seenInChat: true,
    threadPosts: 22,
    note: "'score = 7/8' arrives with 7 grid rows: it is guesses used, not points.",
  },
  {
    slug: "poople",
    name: "Poople",
    url: "https://poople.io",
    category: "word",
    scoring: { kind: "guesses", max: 6 },
    bestPoints: 1,
    verified: false,
    seenInChat: true,
    threadPosts: 31,
    note: "Golf-like: '8/6' is 8 guesses against a par of 6, and still a solve.",
  },
  {
    slug: "sedecordle",
    name: "Sedecordle",
    url: "https://sedecordle.com",
    category: "word",
    scoring: { kind: "guesses", max: 21 },
    bestPoints: 16,
    verified: true,
    seenInChat: false,
    threadPosts: 3,
  },
  {
    slug: "la-palabra-del-dia",
    name: "La palabra del día",
    url: "https://lapalabradeldia.com",
    category: "word",
    scoring: { kind: "guesses", max: 6 },
    bestPoints: 1,
    verified: true,
    seenInChat: true,
    threadPosts: 2,
    note: "Spanish-language Wordle.",
  },
  {
    slug: "contexto",
    name: "Contexto",
    url: "https://contexto.me",
    category: "word",
    scoring: { kind: "guesses", max: 999 },
    bestPoints: 1,
    verified: false,
    seenInChat: true,
    threadPosts: 0,
    note: "Linked in the thread but never scored there.",
  },

  // ---- geo --------------------------------------------------------------
  {
    slug: "globle",
    name: "Globle",
    url: "https://globle-game.com",
    category: "geo",
    scoring: { kind: "guesses", max: 999 },
    bestPoints: 1,
    verified: true,
    seenInChat: true,
    threadPosts: 42,
  },
  {
    slug: "flagle",
    name: "Flagle",
    url: "https://www.flagle.io",
    category: "geo",
    scoring: { kind: "guesses", max: 6 },
    bestPoints: 1,
    verified: true,
    seenInChat: true,
    threadPosts: 27,
  },
  {
    slug: "travle",
    name: "Travle",
    url: "https://travle.earth",
    category: "geo",
    scoring: { kind: "par" },
    bestPoints: 0,
    verified: false,
    seenInChat: true,
    threadPosts: 21,
    note: "Posts as +N over par; +0 is 'Perfect'.",
  },
  {
    slug: "worldle",
    name: "Worldle",
    url: "https://worldle.teuteuf.fr",
    category: "geo",
    scoring: { kind: "guesses", max: 6 },
    bestPoints: 1,
    verified: true,
    seenInChat: true,
    threadPosts: 14,
  },
  {
    slug: "timeguessr",
    name: "TimeGuessr",
    url: "https://timeguessr.com",
    category: "geo",
    scoring: { kind: "points", max: 50000 },
    bestPoints: 50000,
    verified: true,
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "farflung",
    name: "Farflung",
    url: "https://farflung.game",
    category: "geo",
    scoring: { kind: "points", max: 500, unit: "km" },
    bestPoints: 500,
    verified: true,
    seenInChat: true,
    threadPosts: 4,
    note: "Points out of 500, five rounds; each Miss scores ~0. Confirmed monotonic in misses across six shares.",
  },
  {
    slug: "plain",
    name: "Plain",
    url: "https://playplain.app",
    category: "geo",
    scoring: { kind: "points", unit: "m" },
    bestPoints: null,
    verified: false,
    seenInChat: true,
    threadPosts: 13,
  },
  {
    slug: "planetle-geogrid",
    name: "Planetle — GeoGrid",
    url: "https://planetle.earth/daily/geogrid",
    category: "geo",
    scoring: { kind: "time" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 9,
  },
  {
    slug: "planetle-geozip",
    name: "Planetle — GeoZip",
    url: "https://planetle.earth/daily/geozip",
    category: "geo",
    scoring: { kind: "time" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 7,
  },
  {
    slug: "planetle-geodraft",
    name: "Planetle — GeoDraft",
    url: "https://planetle.earth/daily/geodraft",
    category: "geo",
    scoring: { kind: "points" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 2,
  },

  // ---- nyt --------------------------------------------------------------
  {
    slug: "connections",
    name: "Connections",
    url: "https://www.nytimes.com/games/connections",
    category: "nyt",
    scoring: { kind: "mistakes", max: 4 },
    bestPoints: 0,
    verified: true,
    seenInChat: false,
    threadPosts: 15,
  },
  {
    slug: "nyt-mini",
    name: "NYT Mini Crossword",
    url: "https://www.nytimes.com/crosswords/game/mini",
    category: "nyt",
    scoring: { kind: "time" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "nyt-midi",
    name: "NYT Midi Crossword",
    url: "https://www.nytimes.com/crosswords/game/midi",
    category: "nyt",
    scoring: { kind: "time" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "spelling-bee",
    name: "NYT Spelling Bee",
    url: "https://www.nytimes.com/puzzles/spelling-bee",
    category: "nyt",
    scoring: { kind: "points" },
    bestPoints: null,
    verified: true,
    seenInChat: true,
    threadPosts: 2,
    note: "Shared as rank badges (Genius) rather than grids.",
  },

  // ---- trivia / other ---------------------------------------------------
  {
    slug: "krillion",
    name: "Krillion",
    url: "https://krillion.io",
    category: "trivia",
    scoring: { kind: "points", max: 700 },
    bestPoints: 700,
    verified: true,
    seenInChat: false,
    threadPosts: 55,
    note: "7 prompts; tiers run Plankton 10 to One in a Krillion 100.",
  },
  {
    slug: "tightrope",
    name: "Tightrope",
    url: "https://www.britannica.com/quiz/tightrope",
    category: "trivia",
    scoring: { kind: "points" },
    bestPoints: null,
    verified: false,
    seenInChat: true,
    threadPosts: 0,
    note: "Linked in the thread but never scored there.",
  },
];

export const GAMES_BY_SLUG = new Map(GAMES.map((g) => [g.slug, g]));

/** Lower is better for every scoring kind except points. */
export function lowerIsBetter(scoring: Scoring): boolean {
  return scoring.kind !== "points" && scoring.kind !== "done";
}

/** Games whose guess count can run past the nominal max (Poople's 8/6). */
const UNCAPPED = new Set(["poople"]);

/** The `games` table row for a catalogue entry, minus `has_share_parser`. */
export interface GameRow {
  id: string;
  name: string;
  url: string;
  category: string;
  scoring_unit: string;
  lower_is_better: boolean;
  best_points: number | null;
  worst_points: number | null;
  can_fail: boolean;
  display_unit: string | null;
  verified: boolean;
  sort_order: number;
}

/**
 * Derives the database columns from the catalogue, so `games` can never
 * disagree with the code that parses and ranks scores.
 */
export function gameRow(game: Game, sortOrder: number): GameRow {
  const s = game.scoring;
  const unit = {
    guesses: "guesses",
    points: "points",
    time: "seconds",
    mistakes: "mistakes",
    par: "strokes",
    done: "done",
  }[s.kind];

  let worst: number | null = null;
  if ((s.kind === "guesses" || s.kind === "mistakes") && s.max < 999) worst = s.max;
  if (s.kind === "points") worst = 0;
  if (UNCAPPED.has(game.slug)) worst = null;

  return {
    id: game.slug,
    name: game.name,
    url: game.url,
    category: game.category,
    scoring_unit: unit,
    lower_is_better: lowerIsBetter(s),
    best_points: game.bestPoints,
    worst_points: worst,
    can_fail: s.kind === "guesses" || s.kind === "mistakes" || s.kind === "par",
    display_unit: s.kind === "points" ? (s.unit ?? null) : null,
    verified: game.verified,
    sort_order: sortOrder,
  };
}
