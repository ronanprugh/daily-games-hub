import { describe, expect, it } from "vitest";
import {
  currentStreak,
  longestStreak,
  overallStats,
  parseScore,
  statsForGame,
  type EntryRow,
} from "./stats";
import { GAMES_BY_SLUG } from "../data/games";

const scoringFor = (slug: string) => {
  const g = GAMES_BY_SLUG.get(slug);
  if (!g) throw new Error(`no such game: ${slug}`);
  return g.scoring;
};

describe("streaks", () => {
  const days = new Set(["2026-11-24", "2026-11-25", "2026-11-26", "2026-11-20"]);

  it("counts a run ending today", () => {
    expect(currentStreak(days, "2026-11-26")).toBe(3);
  });

  it("does NOT break a streak just because today is unplayed", () => {
    // The day is not over. Opening the page in the morning must not report
    // that a three-day run has ended.
    expect(currentStreak(days, "2026-11-27")).toBe(3);
  });

  it("breaks after a full missed day", () => {
    expect(currentStreak(days, "2026-11-28")).toBe(0);
  });

  it("is zero when nothing has been played", () => {
    expect(currentStreak(new Set(), "2026-11-27")).toBe(0);
  });

  it("finds the longest run, not the most recent", () => {
    expect(longestStreak(days)).toBe(3);
  });

  it("handles a run spanning a month boundary", () => {
    const across = new Set(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(longestStreak(across)).toBe(4);
    expect(currentStreak(across, "2026-11-02")).toBe(4);
  });
});

describe("parseScore", () => {
  it("reads a Wordle guess count", () => {
    expect(parseScore(scoringFor("wordle"), "4/6")).toEqual({ score: 4, solved: true });
  });

  it("treats X as played-but-not-solved, not as absent", () => {
    // A failed Wordle still happened. Recording it as a non-play would
    // silently extend a streak that the player actually broke.
    expect(parseScore(scoringFor("wordle"), "X/6")).toEqual({
      score: null,
      solved: false,
    });
  });

  it("reads a crossword clock as seconds", () => {
    expect(parseScore(scoringFor("nyt-mini"), "0:24")).toEqual({
      score: 24,
      solved: true,
    });
    expect(parseScore(scoringFor("nyt-mini"), "1:05")).toEqual({
      score: 65,
      solved: true,
    });
  });

  it("reads travle's over-par notation, including a perfect zero", () => {
    expect(parseScore(scoringFor("travle"), "+2")).toEqual({ score: 2, solved: true });
    expect(parseScore(scoringFor("travle"), "+0")).toEqual({ score: 0, solved: true });
  });

  it("strips thousands separators from points", () => {
    expect(parseScore(scoringFor("timeguessr"), "32,741")).toEqual({
      score: 32741,
      solved: true,
    });
  });

  it("reads a distance with its unit attached", () => {
    expect(parseScore(scoringFor("farflung"), "280 km")).toEqual({
      score: 280,
      solved: true,
    });
  });

  it("accepts a bare number where the game has no fraction", () => {
    expect(parseScore(scoringFor("krillion"), "360")).toEqual({
      score: 360,
      solved: true,
    });
  });

  it("treats an empty value as done for a done-only game", () => {
    expect(parseScore(scoringFor("planetle-geozip"), "")).toEqual({
      score: null,
      solved: true,
    });
  });

  it("rejects an empty value for a game that needs a number", () => {
    expect(parseScore(scoringFor("wordle"), "")).toBeNull();
  });

  it("rejects nonsense rather than storing a NaN", () => {
    expect(parseScore(scoringFor("wordle"), "banana")).toBeNull();
  });
});

describe("statsForGame", () => {
  const rows: EntryRow[] = [
    { game_slug: "wordle", played_on: "2026-11-26", solved: true, score: 4 },
    { game_slug: "wordle", played_on: "2026-11-25", solved: true, score: 3 },
    { game_slug: "wordle", played_on: "2026-11-24", solved: false, score: null },
    { game_slug: "krillion", played_on: "2026-11-26", solved: true, score: 360 },
  ];

  it("counts plays and solves separately", () => {
    const s = statsForGame("wordle", rows, "2026-11-26");
    expect(s.plays).toBe(3);
    expect(s.solves).toBe(2);
    expect(s.solveRate).toBeCloseTo(2 / 3);
  });

  it("takes the LOWEST score as best where lower is better", () => {
    expect(statsForGame("wordle", rows, "2026-11-26").best).toBe(3);
  });

  it("takes the HIGHEST score as best where higher is better", () => {
    // Krillion is points. Using the same direction for both would report a
    // player's worst day as their best.
    expect(statsForGame("krillion", rows, "2026-11-26").best).toBe(360);
  });

  it("averages only the solved attempts", () => {
    expect(statsForGame("wordle", rows, "2026-11-26").average).toBeCloseTo(3.5);
  });

  it("counts a failed attempt toward the streak", () => {
    // Showing up counts. The streak is about playing daily, not winning.
    expect(statsForGame("wordle", rows, "2026-11-26").currentStreak).toBe(3);
  });

  it("reports nulls rather than zeros for a game never played", () => {
    const s = statsForGame("contexto", rows, "2026-11-26");
    expect(s.plays).toBe(0);
    expect(s.solveRate).toBeNull();
    expect(s.best).toBeNull();
    expect(s.lastPlayed).toBeNull();
  });
});

describe("overallStats", () => {
  const rows: EntryRow[] = [
    { game_slug: "wordle", played_on: "2026-11-26", solved: true, score: 4 },
    { game_slug: "krillion", played_on: "2026-11-26", solved: true, score: 360 },
    { game_slug: "wordle", played_on: "2026-11-25", solved: true, score: 3 },
  ];

  it("counts a day once however many games were played on it", () => {
    const s = overallStats(rows, "2026-11-26");
    expect(s.totalPlays).toBe(3);
    expect(s.daysActive).toBe(2);
    expect(s.currentStreak).toBe(2);
    expect(s.gamesPlayed).toBe(2);
  });
});
