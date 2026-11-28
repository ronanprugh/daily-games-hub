import { redirect } from "next/navigation";
import { currentUser } from "../lib/auth";
import { sql } from "../lib/db";
import { signOut } from "./actions";
import { GAMES } from "../data/games";
import { isoDay, overallStats, statsForGame, type EntryRow } from "../lib/stats";
import { GameCard } from "../components/GameCard";

export const dynamic = "force-dynamic";

const SECTIONS: { key: string; label: string }[] = [
  { key: "nyt", label: "New York Times" },
  { key: "word", label: "Word" },
  { key: "geo", label: "Geography" },
  { key: "trivia", label: "Trivia" },
  { key: "other", label: "Other" },
];

export default async function Hub() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const rows = (await sql()`
    SELECT game_id AS game_slug,
           to_char(date_played, 'YYYY-MM-DD') AS played_on,
           solved,
           points::float8 AS score,
           board
      FROM scores
     WHERE player_id = ${user.id}
     ORDER BY date_played DESC
  `) as (EntryRow & { board: string | null })[];

  const today = isoDay(new Date());
  const todayByGame = new Map(
    rows.filter((r) => r.played_on === today).map((r) => [r.game_slug, r]),
  );
  const overall = overallStats(rows, today);
  const playedToday = todayByGame.size;

  return (
    <main>
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daily Games</h1>
          <p className="text-sm text-[var(--muted)]">
            {playedToday} of {GAMES.length} done today
          </p>
        </div>
        <form action={signOut}>
          <button className="min-h-11 text-sm text-[var(--muted)] hover:underline">
            Sign out, {user.username}
          </button>
        </form>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Streak", overall.currentStreak === 0 ? "—" : `🔥 ${overall.currentStreak}`],
          ["Longest", String(overall.longestStreak)],
          ["Days", String(overall.daysActive)],
          ["Plays", String(overall.totalPlays)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3"
          >
            <div className="text-xl font-semibold">{value}</div>
            <div className="text-xs text-[var(--muted)]">{label}</div>
          </div>
        ))}
      </section>

      {SECTIONS.map((section) => {
        const games = GAMES.filter((g) => g.category === section.key).sort(
          (a, b) => b.threadPosts - a.threadPosts,
        );
        if (games.length === 0) return null;
        return (
          <section key={section.key} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-[var(--muted)] uppercase">
              {section.label}
            </h2>
            <ul className="flex flex-col gap-2">
              {games.map((game) => {
                const entry = todayByGame.get(game.slug);
                return (
                  <GameCard
                    key={game.slug}
                    game={game}
                    day={today}
                    today={
                      entry
                        ? { score: entry.score, solved: entry.solved, board: entry.board }
                        : null
                    }
                    stats={statsForGame(game.slug, rows, today)}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
