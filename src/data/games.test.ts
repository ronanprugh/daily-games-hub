import { describe, expect, it } from "vitest";
import { GAMES, GAMES_BY_SLUG, gameRow } from "./games";

const row = (slug: string) => {
  const g = GAMES_BY_SLUG.get(slug);
  if (!g) throw new Error(`no game ${slug}`);
  return gameRow(g, 0);
};

describe("gameRow", () => {
  it("maps a guesses game", () => {
    expect(row("wordle")).toMatchObject({
      scoring_unit: "guesses",
      lower_is_better: true,
      best_points: 1,
      worst_points: 6,
      can_fail: true,
      display_unit: null,
    });
  });

  it("maps a points game", () => {
    expect(row("krillion")).toMatchObject({
      scoring_unit: "points",
      lower_is_better: false,
      best_points: 700,
      worst_points: 0,
      can_fail: false,
    });
  });

  it("carries a display unit for points that have one", () => {
    expect(row("farflung").display_unit).toBe("km");
    expect(row("plain").display_unit).toBe("m");
  });

  it("calls a time game seconds, with no cap", () => {
    expect(row("nyt-mini")).toMatchObject({
      scoring_unit: "seconds",
      lower_is_better: true,
      worst_points: null,
    });
  });

  it("gives Poople no worst, because 8/6 happens", () => {
    expect(row("poople").worst_points).toBeNull();
  });

  it("calls travle strokes over par, best 0", () => {
    expect(row("travle")).toMatchObject({ scoring_unit: "strokes", best_points: 0 });
  });
});

describe("the catalogue is internally consistent", () => {
  it("never states a best and worst that contradict the direction", () => {
    // Exactly the mistake Farflung had: declared lower-is-better with a best of
    // 500 and a worst of 0. When both ends are stated they must agree with
    // lower_is_better, or "best" ranks a player's worst day first.
    for (const game of GAMES) {
      const r = gameRow(game, 0);
      if (r.best_points === null || r.worst_points === null) continue;
      const lowerWins = r.best_points < r.worst_points;
      expect(lowerWins, `${game.slug}: best/worst contradict direction`).toBe(
        r.lower_is_better,
      );
    }
  });

  it("uses unique slugs", () => {
    expect(new Set(GAMES.map((g) => g.slug)).size).toBe(GAMES.length);
  });

  it("flags the games whose meaning is still unconfirmed", () => {
    const unverified = GAMES.filter((g) => !g.verified).map((g) => g.slug);
    expect(unverified.sort()).toEqual(
      [
        "contexto",
        "farflung",
        "plain",
        "poople",
        "tightrope",
        "travle",
        "word500",
      ].sort(),
    );
  });
});
