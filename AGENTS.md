# Repo Conventions

Authoritative for any agent or human working in this repo.

## What this is

A personal daily-games hub: one page listing every daily puzzle the group
plays, with a link to each, a place to record the day's score, and running
stats. Deployed as its own Vercel project and mounted on `ronanprugh.com/games`
via a rewrite in the `personal-site` repo — the same pattern ScoreMate uses.

## Stack & layout

- **Framework:** Next.js 16, App Router. Server components by default.
- **Language:** TypeScript `strict`, plus `noUncheckedIndexedAccess`. No `any`.
- **Styling:** Tailwind v4, CSS-first config in `globals.css`. Mobile-first.
- **Touch targets:** interactive elements are at least 44px (`min-h-11`).
- **Database:** Postgres (Neon) via `@neondatabase/serverless`.
- **Package manager:** pnpm.

```
src/
  app/          # routes, layouts, server actions
  components/   # UI
  data/games.ts # the game catalogue — links and how each one scores
  lib/          # db, auth, password, stats
db/             # schema.sql and the bootstrap migrator
docs/specs/     # SDD specs, tasks, audits, proofs
```

## Hard rules

1. **Passwords are never stored or logged in the clear.** scrypt only, via
   `src/lib/password.ts`, compared with `timingSafeEqual`.
2. **The database stores the HASH of a session token, never the token.** A
   leaked table must not hand out working sessions.
3. **Sign-in must not reveal whether a username exists** — same message, and
   the same work done, either way.
4. **`src/lib/stats.ts` and `src/lib/password.ts` stay pure.** No database, no
   `next/*` imports. That is what makes them testable without either.
5. **The game catalogue is code; the `games` table is its mirror.**
   `src/data/games.ts` is the source of truth, and `db/migrate.mts` upserts it
   into `games` on every run. Never hand-edit `games` rows — the next migrate
   overwrites them. Changing a game's direction in code re-ranks every stored
   score, because `scores.points` is stored raw.
6. **`scores.raw` is kept on purpose.** Several games' meanings were inferred
   rather than documented (see `verified` in the catalogue). If a parser turns
   out wrong, points are re-derived from `raw` instead of being lost.

## Scoring

Games do not share a scale. A Wordle is 1-6 lower-is-better; Krillion is
0-700 higher-is-better; a Mini is a clock. `Scoring` in `src/data/games.ts`
declares which, and `parseScore` / `lowerIsBetter` are the only places that
interpret it. Never compare two games' raw numbers.

## Migrations

`db/migrate.mts` is a bootstrap: it replays `db/schema.sql`, which is additive
and `IF NOT EXISTS` throughout. That is the only reason CI is allowed to run
it unattended. **Keep `schema.sql` additive** — the Migrate workflow blocks
`DROP`, `TRUNCATE`, `DELETE` and `ALTER` precisely because this migrator
cannot undo them. Needing one of those means it is time for a real migration
tool, not a manual override as a habit.

## Quality gates

All must pass before any commit:

- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test:ci`

Tests are colocated (`foo.ts` beside `foo.test.ts`).

## Commit conventions

Conventional Commits, enforced by commitlint in CI. Reference the SDD task in
the body where one applies.
