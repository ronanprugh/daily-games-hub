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
  | { kind: "points"; max?: number }
  /** Completion time. Lower is better. Stored as seconds. */
  | { kind: "time" }
  /** Distance from the target, in `unit`. Lower is better. */
  | { kind: "distance"; unit: "m" | "km"; max?: number }
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
    seenInChat: false,
    threadPosts: 46,
  },
  {
    slug: "word500",
    name: "Word500",
    url: "https://www.word500.com",
    category: "word",
    scoring: { kind: "points", max: 8 },
    seenInChat: true,
    threadPosts: 22,
    note: "Scores out of 8, and posts as 'No hints used, score = 8/8'.",
  },
  {
    slug: "poople",
    name: "Poople",
    url: "https://poople.io",
    category: "word",
    scoring: { kind: "guesses", max: 6 },
    seenInChat: true,
    threadPosts: 31,
    note: "Denominator varies by day (/5 and /6 both seen).",
  },
  {
    slug: "sedecordle",
    name: "Sedecordle",
    url: "https://sedecordle.com",
    category: "word",
    scoring: { kind: "guesses", max: 21 },
    seenInChat: false,
    threadPosts: 3,
  },
  {
    slug: "la-palabra-del-dia",
    name: "La palabra del día",
    url: "https://lapalabradeldia.com",
    category: "word",
    scoring: { kind: "guesses", max: 6 },
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
    seenInChat: true,
    threadPosts: 42,
  },
  {
    slug: "flagle",
    name: "Flagle",
    url: "https://www.flagle.io",
    category: "geo",
    scoring: { kind: "guesses", max: 6 },
    seenInChat: true,
    threadPosts: 27,
  },
  {
    slug: "travle",
    name: "Travle",
    url: "https://travle.earth",
    category: "geo",
    scoring: { kind: "par" },
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
    seenInChat: true,
    threadPosts: 14,
  },
  {
    slug: "timeguessr",
    name: "TimeGuessr",
    url: "https://timeguessr.com",
    category: "geo",
    scoring: { kind: "points", max: 50000 },
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "farflung",
    name: "Farflung",
    url: "https://farflung.game",
    category: "geo",
    scoring: { kind: "distance", unit: "km", max: 500 },
    seenInChat: true,
    threadPosts: 4,
  },
  {
    slug: "plain",
    name: "Plain",
    url: "https://playplain.app",
    category: "geo",
    scoring: { kind: "distance", unit: "m" },
    seenInChat: true,
    threadPosts: 13,
  },
  {
    slug: "planetle-geogrid",
    name: "Planetle — GeoGrid",
    url: "https://planetle.earth/daily/geogrid",
    category: "geo",
    scoring: { kind: "time" },
    seenInChat: true,
    threadPosts: 9,
  },
  {
    slug: "planetle-geozip",
    name: "Planetle — GeoZip",
    url: "https://planetle.earth/daily/geozip",
    category: "geo",
    scoring: { kind: "done" },
    seenInChat: true,
    threadPosts: 7,
  },
  {
    slug: "planetle-geodraft",
    name: "Planetle — GeoDraft",
    url: "https://planetle.earth/daily/geodraft",
    category: "geo",
    scoring: { kind: "points" },
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
    seenInChat: false,
    threadPosts: 15,
  },
  {
    slug: "nyt-mini",
    name: "NYT Mini Crossword",
    url: "https://www.nytimes.com/crosswords/game/mini",
    category: "nyt",
    scoring: { kind: "time" },
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "nyt-midi",
    name: "NYT Midi Crossword",
    url: "https://www.nytimes.com/crosswords/game/midi",
    category: "nyt",
    scoring: { kind: "time" },
    seenInChat: true,
    threadPosts: 5,
  },
  {
    slug: "spelling-bee",
    name: "NYT Spelling Bee",
    url: "https://www.nytimes.com/puzzles/spelling-bee",
    category: "nyt",
    scoring: { kind: "points" },
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
