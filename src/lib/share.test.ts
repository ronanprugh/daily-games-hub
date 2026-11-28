import { describe, expect, it } from "vitest";
import {
  detectGame,
  extractBoard,
  NO_SHARE_FORMAT,
  parseEntry,
  SHARE_PARSERS,
} from "./share";
import { GAMES } from "../data/games";

/**
 * One sample per game, in the exact shape each game's Share button produces.
 *
 * Shapes were taken from real shares; the numbers are changed and any chat
 * around them is left out, so nothing from the thread itself is in this repo.
 */
const SAMPLES: Record<string, { text: string; score: number | null; solved: boolean }> = {
  wordle: {
    text: "Wordle 1,987 4/6*\n\n⬛🟨⬛⬛🟨\n🟩🟨⬛🟨⬛\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩",
    score: 4,
    solved: true,
  },
  poople: {
    text: "Poople #456 8/6\n⬜⬜⬜⬜\n⬜⬜⬜⬜\n⬜⬜⬜⬜\n⬜⬜⬜⬜\n⬜⬜⬜⬜\n⬜🟫⬜⬜\n⬜🟫🟫⬜\n⬜🟫🟫🟫\n🟫🟫🟫🟫",
    score: 2,
    solved: true,
  },
  word500: {
    text: "Word500, Standard, 13-NOV-2026\nNo hints used, score = 7/8\n0️⃣1️⃣4️⃣ \n1️⃣1️⃣3️⃣ \n2️⃣0️⃣3️⃣ \n1️⃣2️⃣2️⃣ \n3️⃣1️⃣1️⃣ \n4️⃣0️⃣1️⃣ \n5️⃣0️⃣0️⃣ \n\nhttps://www.word500.com",
    score: 7,
    solved: true,
  },
  sedecordle: {
    text: "#Sedecordle Daily #1734 20/21 🔥 1 day streak\n0️⃣5️⃣⬛1️⃣3️⃣\nsedecordle.com",
    score: 20,
    solved: true,
  },
  "la-palabra-del-dia": {
    text: "La palabra del día #1785 5/6\n\n⬜🟨⬜⬜⬜\n🟩🟩🟩🟩🟩",
    score: 5,
    solved: true,
  },
  contexto: {
    text: "I played contexto.me 11/28/2026 and got it in 78 guesses.\n\n🟩🟩 17\n🟨🟨🟨 22\n🟥🟥🟥🟥🟥 39",
    score: 78,
    solved: true,
  },
  globle: {
    text: "🌎 Nov 18, 2026 🌍\n🔥 1 | Avg. Guesses: 9\n⬜⬜🟨🟥🟩 = 9\n\nhttps://globle-game.com\n#globle",
    score: 9,
    solved: true,
  },
  flagle: {
    text: "#Flagle #1733 (20.11.2026) 2/6\n🟩🟩🟩\n🟩🟩🟩\nhttps://www.flagle.io",
    score: 2,
    solved: true,
  },
  worldle: {
    text: "#Worldle #1764 (20.11.2026) 3/6 (100%)\n🟩🟩🟨⬜⬜⬅️\n🟩🟩🟩🟩🟩🎉",
    score: 3,
    solved: true,
  },
  travle: {
    text: "#travle #1437 +2\n✅🟧🟧✅✅🟩✅✅",
    score: 2,
    solved: true,
  },
  timeguessr: {
    text: "TimeGuessr #1270 — 32,741/50,000\n\n1️⃣ 🏆6,779 · 📅 1y · 🌍 1203.3mi",
    score: 32741,
    solved: true,
  },
  farflung: {
    text: "Farflung #52 · 280/500 km\nRare · Miss · Rare · Rare · Rare",
    score: 280,
    solved: true,
  },
  plain: {
    text: "Plain #38 ✈️ 6,112 m\n🎯🟥🟥🎯🎯🟥🎯\nTop 10% today\nCan you beat me? 👇",
    score: 6112,
    solved: true,
  },
  "planetle-geogrid": {
    text: "Planetle · GeoGrid · 2026-11-26\n⏱️ 6:41 · ✨ 25% · 🏆 #216/232\n🟪🟩🟪",
    score: 401,
    solved: true,
  },
  "planetle-geozip": {
    text: "🌍 Daily GeoZip 2026-11-20 ✅\n⏱️ 1:25\n🏆 Rank: #105 today",
    score: 85,
    solved: true,
  },
  "planetle-geodraft": {
    text: "Planetle · GeoDraft · 2026-11-24\n📊 157 pts · 🏆 #10/198\n🟩🟩⭐🟨",
    score: 157,
    solved: true,
  },
  connections: {
    text: "Connections\nPuzzle #1256\n🟪🟩🟪🟪\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟪🟪🟪🟪\n🟦🟦🟦🟦",
    score: 1,
    solved: true,
  },
  "nyt-mini": {
    text: "I solved the 11/16/2026 New York Times Mini Crossword in 0:24!",
    score: 24,
    solved: true,
  },
  "nyt-midi": {
    text: "I solved the 11/18/2026 New York Times Midi Crossword in 2:18!",
    score: 138,
    solved: true,
  },
  "spelling-bee": {
    text: "https://www.nytimes.com/badges/games/v1/bee.html?d=2026-11-19&l=abcdefg&p=130&r=Genius&c=0&smid=na-share",
    score: 130,
    solved: true,
  },
  krillion: {
    text: "Krillion #121 🦐\n360\n\n🐟🦑🦑🐟🦑🦑🦑",
    score: 360,
    solved: true,
  },
};

describe("every game's share text parses", () => {
  for (const [slug, sample] of Object.entries(SAMPLES)) {
    it(slug, () => {
      expect(parseEntry(slug, sample.text)).toEqual({
        result: { score: sample.score, solved: sample.solved },
      });
    });
  }
});

describe("the catalogue and the parsers agree", () => {
  it("gives every game a share parser or an explicit 'no format'", () => {
    // A game added to the catalogue without either would accept only typed
    // scores, and nothing would say so.
    for (const game of GAMES) {
      const covered = game.slug in SHARE_PARSERS || NO_SHARE_FORMAT.has(game.slug);
      expect(covered, `${game.slug} has no share parser`).toBe(true);
    }
  });

  it("has a sample for every parser", () => {
    for (const slug of Object.keys(SHARE_PARSERS)) {
      expect(SAMPLES[slug], `no sample for ${slug}`).toBeDefined();
    }
  });

  it("detects each sample as its own game and no other", () => {
    // Worldle must not be read as Wordle, nor Midi as Mini. Detection runs
    // every parser, so one too-loose pattern would steal another's shares.
    for (const [slug, sample] of Object.entries(SAMPLES)) {
      const claimed = Object.entries(SHARE_PARSERS)
        .filter(([, parse]) => parse(sample.text) !== null)
        .map(([s]) => s);
      expect(claimed, `${slug} sample claimed by ${claimed.join(", ")}`).toEqual([slug]);
      expect(detectGame(sample.text)).toBe(slug);
    }
  });
});

describe("misses and failures", () => {
  it("reads a failed Wordle as played-but-not-solved", () => {
    expect(parseEntry("wordle", "Wordle 1,990 X/6\n\n⬛⬛⬛⬛⬛")).toEqual({
      result: { score: null, solved: false },
    });
  });

  it("reads travle's '(1 away)' as a miss", () => {
    expect(parseEntry("travle", "#travle #1436 (1 away)\n🟧🟧✅✅")).toEqual({
      result: { score: null, solved: false },
    });
  });

  it("reads Connections with four mistakes as unsolved", () => {
    const text = "Connections\nPuzzle #1257\n🟨🟩🟨🟨\n🟪🟦🟪🟪\n🟨🟨🟩🟨\n🟦🟪🟦🟦";
    expect(parseEntry("connections", text)).toEqual({
      result: { score: 4, solved: false },
    });
  });
});

describe("pastes that lost their line breaks", () => {
  it("still reads the screenshot's flattened Wordle", () => {
    // Exactly what a single-line <input> produced before the textarea: the
    // header and the whole grid run together on one line.
    const flat = "Wordle 1,987 6/6* 🟩⬛🟨⬛🟨 🟩🟨⬛🟨⬛ 🟩⬛🟩🟩⬛ 🟩🟩🟩🟩🟩";
    expect(parseEntry("wordle", flat)).toEqual({ result: { score: 6, solved: true } });
  });

  it("still reads a flattened Connections grid", () => {
    const flat = "Connections Puzzle #1256 🟪🟩🟪🟪 🟨🟨🟨🟨 🟩🟩🟩🟩 🟪🟪🟪🟪 🟦🟦🟦🟦";
    expect(parseEntry("connections", flat)).toEqual({
      result: { score: 1, solved: true },
    });
  });
});

describe("wrong box, and nonsense", () => {
  it("names the right game when a share is pasted under the wrong one", () => {
    expect(parseEntry("wordle", SAMPLES["krillion"]!.text)).toEqual({
      error: "That looks like a Krillion share. Paste it under Krillion.",
    });
  });

  it("still accepts a short typed score", () => {
    expect(parseEntry("wordle", "4/6")).toEqual({ result: { score: 4, solved: true } });
    expect(parseEntry("tightrope", "1,240")).toEqual({
      result: { score: 1240, solved: true },
    });
  });

  it("rejects text that is nobody's share", () => {
    const out = parseEntry("wordle", "had a great day");
    expect("error" in out && out.error).toMatch(/could not read/i);
  });

  it("rejects an absurdly long paste", () => {
    const out = parseEntry("wordle", "4/6 " + "x".repeat(3000));
    expect("error" in out && out.error).toMatch(/too long/i);
  });
});

describe("extractBoard", () => {
  it("keeps the grid and drops the header", () => {
    expect(extractBoard(SAMPLES["wordle"]!.text)).toBe(
      "⬛🟨⬛⬛🟨\n🟩🟨⬛🟨⬛\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩",
    );
  });

  it("keeps keycap digits byte-for-byte", () => {
    // Word500's board is keycaps, which are three code points each
    // (digit, U+FE0F, U+20E3). Losing either suffix would corrupt it.
    const board = extractBoard(SAMPLES["word500"]!.text);
    expect(board).toContain("0️⃣1️⃣4️⃣");
    expect(board).toContain("5️⃣0️⃣0️⃣");
  });

  it("drops link lines", () => {
    expect(extractBoard(SAMPLES["globle"]!.text)).not.toMatch(/https?:/);
  });

  it("is null for a typed score", () => {
    expect(extractBoard("4/6")).toBeNull();
  });

  it("is null for a share with no grid", () => {
    expect(extractBoard(SAMPLES["nyt-mini"]!.text)).toBeNull();
  });
});

describe("confirmed in the verification pass", () => {
  it("Farflung: points fall as misses rise, with a link line attached", () => {
    // Confirmed 2026-11-28: across six shares, 1 miss -> 280-295, 2 -> 180,
    // 3 -> 140, 4 -> 85. Points out of 500, higher is better.
    const text =
      "Farflung #54 · 180/500 km\nCommon · Rare · Miss · Rare · Miss\nhttps://farflung.game/s/abc123?e=54";
    expect(parseEntry("farflung", text)).toEqual({
      result: { score: 180, solved: true },
    });
  });
});

describe("Farflung's rarity table", () => {
  // From the game's own scoring screen. Each of five rounds scores by how rare
  // the answer was; the headline is their sum, out of 500.
  const TIER: Record<string, number> = {
    Farflung: 100,
    Elusive: 85,
    Rare: 70,
    Uncommon: 55,
    Common: 40,
    Miss: 0,
  };
  const SHARES = [
    "Farflung #52 · 280/500 km\nRare · Miss · Rare · Rare · Rare",
    "Farflung #52 · 140/500 km\nRare · Miss · Rare · Miss · Miss",
    "Farflung #53 · 295/500 km\nMiss · Elusive · Elusive · Uncommon · Rare",
    "Farflung #53 · 85/500 km\nMiss · Miss · Elusive · Miss · Miss",
    "Farflung #54 · 180/500 km\nCommon · Rare · Miss · Rare · Miss",
  ];

  it("headline equals the sum of the tiers, for every known share", () => {
    // If this ever fails, Farflung changed its scoring or its share format,
    // and the parser's reading of the headline is no longer safe to trust.
    for (const text of SHARES) {
      const tiers = (text.split("\n")[1] ?? "").split(" · ");
      const sum = tiers.reduce((n, t) => n + (TIER[t.trim()] ?? NaN), 0);
      expect(parseEntry("farflung", text)).toEqual({
        result: { score: sum, solved: true },
      });
    }
  });
});

describe("Plain", () => {
  it("parses a share with a rank, a streak-free footer and a link", () => {
    const text =
      "Plain #42 ✈️ 4,159 m\n🎯🟩🟧🟥🟨🟨🟥\nTop 13% today\nCan you beat me? 👇\nhttps://playplain.app/c/ABC123";
    expect(parseEntry("plain", text)).toEqual({ result: { score: 4159, solved: true } });
    // Only the tile row is board — not the rank, the call to action, or the
    // link. (The first version of this test asserted the caption WAS board,
    // matching buggy output instead of the right answer.)
    expect(extractBoard(text)).toBe("🎯🟩🟧🟥🟨🟨🟥");
  });
});

describe("extractBoard keeps real boards with words in them", () => {
  it("keeps TimeGuessr's numbered round rows", () => {
    const board = extractBoard(SAMPLES["timeguessr"]!.text);
    expect(board).toBe("1️⃣ 🏆6,779 · 📅 1y · 🌍 1203.3mi");
  });

  it("drops a streak caption", () => {
    const text =
      "Plain #38 ✈️ 4,181 m\n🟨🟥🟥🟥🟩🟥🎯\n🔥 2-day streak\nCan you beat me? 👇";
    expect(extractBoard(text)).toBe("🟨🟥🟥🟥🟩🟥🎯");
  });
});

describe("Word500", () => {
  const LOSS =
    "Word500, Standard, 28-NOV-2026\nNo hints used, score = LOSS\n1️⃣1️⃣3️⃣ \n0️⃣1️⃣4️⃣ \n1️⃣1️⃣3️⃣ \n0️⃣1️⃣4️⃣ \n0️⃣1️⃣4️⃣ \n0️⃣1️⃣4️⃣ \n0️⃣1️⃣4️⃣ \n0️⃣1️⃣4️⃣ \n\nhttps://www.word500.com\n#word500";

  it("reads 'score = LOSS' as played-but-not-solved", () => {
    expect(parseEntry("word500", LOSS)).toEqual({
      result: { score: null, solved: false },
    });
  });

  it("a win's score is its row count, and its last row is 5-0-0", () => {
    // The mechanic that confirms 'guesses used': each row is a guess, scored
    // as (right spot, wrong spot, absent) counts summing to 5.
    const rows = (text: string) => text.split("\n").filter((l) => /^\d️?⃣/u.test(l));
    const win = SAMPLES["word500"]!.text;
    const winRows = rows(win);
    expect(parseEntry("word500", win)).toEqual({
      result: { score: winRows.length, solved: true },
    });
    expect(winRows.at(-1)?.trim()).toBe("5️⃣0️⃣0️⃣");
    // A loss uses all 8 guesses and never reaches 5-0-0.
    expect(rows(LOSS)).toHaveLength(8);
    expect(rows(LOSS).some((r) => r.trim() === "5️⃣0️⃣0️⃣")).toBe(false);
  });
});

describe("Poople", () => {
  const PERFECT =
    "Poople #470 5/5\n⬜⬜⬜⬜\n⬜⬜⬜🟫\n⬜⬜⬜🟫\n⬜⬜🟫🟫\n🟫⬜🟫🟫\n🟫🟫🟫🟫\n\nhttps://poople.io/";

  it("stores moves over par, so a perfect day is 0", () => {
    expect(parseEntry("poople", PERFECT)).toEqual({ result: { score: 0, solved: true } });
  });

  it("every board is a blank row, then one row per move, ending full", () => {
    // The shape that supports reading "8/6" as moves/par: rows = moves + 1,
    // and moves are never below par. Enforced on every Poople fixture.
    for (const text of [PERFECT, SAMPLES["poople"]!.text]) {
      const m = /(\d+)\/(\d+)/.exec(text)!;
      const moves = Number(m[1]);
      const par = Number(m[2]);
      const rows = text.split("\n").filter((l) => /^[⬜🟫]+$/u.test(l));
      expect(rows).toHaveLength(moves + 1);
      expect(rows[0]).toBe("⬜⬜⬜⬜");
      expect(rows.at(-1)).toBe("🟫🟫🟫🟫");
      expect(moves).toBeGreaterThanOrEqual(par);
    }
  });

  it("refuses a typed '8/6' rather than storing it as 8 over par", () => {
    expect("error" in parseEntry("poople", "8/6")).toBe(true);
    expect(parseEntry("poople", "+2")).toEqual({ result: { score: 2, solved: true } });
  });
});

describe("Travle", () => {
  it.each([
    ["#travle #1445 +0\n🟩🟩✅\nhttps://travle.earth", 0, true],
    ["#travle #1438 +0 (Perfect)\n✅✅✅", 0, true],
    ["#travle #1440 +4 (2 hints)\n✅🟧✅🟧", 4, true],
    ["#travle #1436 (1 away)\n🟧🟧✅✅", null, false],
  ])("%s", (text, score, solved) => {
    // '+0' arrives both with and without '(Perfect)' — confirmed 2026-11-28.
    expect(parseEntry("travle", text)).toEqual({ result: { score, solved } });
  });
});

describe("Contexto", () => {
  it("bucket counts on the board sum to the guess total", () => {
    // Confirmed 2026-11-28 from a real share. The format carries a date, not
    // the '#812' this parser was first written from memory to expect.
    const text = SAMPLES["contexto"]!.text;
    const sum = (extractBoard(text) ?? "")
      .split("\n")
      .reduce((n, line) => n + Number(/(\d+)\s*$/.exec(line)?.[1] ?? 0), 0);
    expect(parseEntry("contexto", text)).toEqual({
      result: { score: sum, solved: true },
    });
  });
});
