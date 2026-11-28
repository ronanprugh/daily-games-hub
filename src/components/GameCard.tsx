"use client";

import { useActionState, useState } from "react";
import { ExternalLink, Check, X } from "lucide-react";
import { saveEntry, clearEntry, type ActionResult } from "../app/actions";
import type { Game } from "../data/games";
import type { GameStats } from "../lib/stats";

/** The short typed form, for when there is no share text to paste. */
function typedHint(game: Game): string {
  switch (game.scoring.kind) {
    case "guesses":
      return `4/${game.scoring.max} or X`;
    case "mistakes":
      return "mistakes, e.g. 2";
    case "time":
      return "0:24";
    case "par":
      return "+2";
    case "points":
      return game.scoring.max ? `points, max ${game.scoring.max}` : "points";
    case "done":
      return "blank for done";
  }
}

function placeholderFor(game: Game): string {
  return `Paste the share text — or type ${typedHint(game)}`;
}

/**
 * What the edit box is pre-filled with.
 *
 * Deliberately NOT the display form: "didn't get it", "perfect" and
 * "2 mistakes" read well but do not parse back, so re-saving an untouched
 * entry would fail. This is the typed form `parseScore` accepts.
 */
function inputValue(game: Game, score: number | null, solved: boolean): string {
  if (!solved) return "X";
  if (score === null) return "";
  switch (game.scoring.kind) {
    case "guesses":
      return `${score}/${game.scoring.max}`;
    case "par":
      return `+${score}`;
    case "time":
      return formatScore(game, score, true);
    default:
      return String(score);
  }
}

function formatScore(game: Game, score: number | null, solved: boolean): string {
  if (!solved) return "didn't get it";
  if (score === null) return "done";
  switch (game.scoring.kind) {
    case "guesses":
      return `${score}/${game.scoring.max}`;
    case "mistakes":
      return `${score} mistake${score === 1 ? "" : "s"}`;
    case "time": {
      const m = Math.floor(score / 60);
      const s = Math.round(score % 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    case "par":
      return score > 0 ? `+${score}` : "perfect";
    case "points": {
      const { max, unit } = game.scoring;
      const n = score.toLocaleString();
      const out = max ? `${n}/${max.toLocaleString()}` : n;
      return unit ? `${out} ${unit}` : out;
    }
    case "done":
      return "done";
  }
}

export function GameCard({
  game,
  day,
  today,
  stats,
}: {
  game: Game;
  day: string;
  /** Today's entry, if there is one. */
  today: { score: number | null; solved: boolean; board: string | null } | null;
  stats: GameStats;
}) {
  const [saveState, save, saving] = useActionState<ActionResult, FormData>(saveEntry, {});
  const [clearState, clear] = useActionState<ActionResult, FormData>(clearEntry, {});
  const [open, setOpen] = useState(today === null);
  const error = saveState.error ?? clearState.error;

  return (
    <li className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={
            "flex size-6 shrink-0 items-center justify-center rounded-full " +
            (today === null
              ? "border border-[var(--line)]"
              : today.solved
                ? "bg-green-600 text-white"
                : "bg-amber-600 text-white")
          }
        >
          {today !== null ? today.solved ? <Check size={14} /> : <X size={14} /> : null}
        </span>

        <a
          href={game.url}
          target="_blank"
          rel="noreferrer noopener"
          className="flex min-h-11 flex-1 items-center gap-1.5 font-medium hover:underline"
        >
          {game.name}
          <ExternalLink size={13} className="opacity-50" />
        </a>

        <span className="text-sm text-[var(--muted)]">
          {today !== null ? formatScore(game, today.score, today.solved) : null}
        </span>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="min-h-11 rounded-lg px-2 text-sm text-[var(--muted)] hover:underline"
          aria-expanded={open}
        >
          {today === null ? "add" : "edit"}
        </button>
      </div>

      {open ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
          <form action={save} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="slug" value={game.slug} />
            <input type="hidden" name="day" value={day} />
            {/* A textarea, not an input: shares are multi-line, and an input
                silently flattens the line breaks the parsers read. */}
            <textarea
              name="score"
              rows={2}
              defaultValue={today ? inputValue(game, today.score, today.solved) : ""}
              placeholder={placeholderFor(game)}
              aria-label={`Score for ${game.name}`}
              onKeyDown={(event) => {
                // Cmd/Ctrl+Enter saves; plain Enter is a newline, as pastes need.
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              className="min-h-11 flex-1 resize-y rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
          {today !== null ? (
            <form action={clear}>
              <input type="hidden" name="slug" value={game.slug} />
              <input type="hidden" name="day" value={day} />
              <button
                type="submit"
                className="min-h-11 rounded-lg px-3 text-sm text-[var(--muted)] hover:underline"
              >
                Clear
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 pl-9 text-sm text-red-600">{error}</p> : null}

      {today?.board ? (
        <pre
          aria-label={`${game.name} board`}
          className="mt-2 pl-9 text-sm leading-tight whitespace-pre-wrap"
        >
          {today.board}
        </pre>
      ) : null}

      {stats.plays > 0 ? (
        <p className="mt-2 pl-9 text-xs text-[var(--muted)]">
          {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} day streak · ` : ""}
          {stats.plays} play{stats.plays === 1 ? "" : "s"}
          {stats.best !== null ? ` · best ${formatScore(game, stats.best, true)}` : ""}
          {stats.solveRate !== null && stats.solveRate < 1
            ? ` · ${Math.round(stats.solveRate * 100)}% solved`
            : ""}
        </p>
      ) : null}
    </li>
  );
}
