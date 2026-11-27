# Daily Games Hub

Every daily puzzle in one place: click through to the game, record the day's
score, keep streaks and stats. Multi-user — everyone signs in and keeps their
own history against the same catalogue.

Lives at **ronanprugh.com/games**, served from its own Vercel project through a
rewrite in `personal-site` (the pattern `02-spec-score-mate-integration`
established for ScoreMate).

## The games

22 of them, in `src/data/games.ts`. The list is not generic — it is what the
group chat actually plays, and every URL was verified. Each game declares how
it scores, because they genuinely differ:

| Scoring          | Games                                                                             | Direction     |
| ---------------- | --------------------------------------------------------------------------------- | ------------- |
| guesses out of N | Wordle, Poople, Flagle, Worldle, Globle, Sedecordle, La palabra del día, Contexto | lower better  |
| points           | Krillion, Word500, TimeGuessr, Spelling Bee, GeoDraft, Tightrope                  | higher better |
| time             | NYT Mini, NYT Midi, Planetle GeoGrid                                              | lower better  |
| distance         | Farflung, Plain                                                                   | lower better  |
| over par         | Travle                                                                            | lower better  |
| mistakes         | Connections                                                                       | lower better  |
| done only        | Planetle GeoZip                                                                   | —             |

## Setup

```bash
pnpm install
```

Create a Postgres database (Vercel → Storage → Neon), then:

```bash
echo "DATABASE_URL=postgres://..." > .env.local
pnpm db:migrate
pnpm dev
```

Optional: set `SIGNUP_CODE` to make account creation invite-only. The hub is a
public URL, so without it anyone who finds the page can sign up.

## Migrations

`db/schema.sql` is applied by `db/migrate.ts`. Every statement is
`IF NOT EXISTS`, so it is a **bootstrap, not a migration framework** — no
ordering, no versioning, no rollback.

The `Migrate` workflow applies it automatically on pushes to `main` that touch
`db/**`, and can be run by hand from the Actions tab. It needs a `DATABASE_URL`
secret (Settings -> Secrets and variables -> Actions). The job declares the
`production` environment, so you can add a required reviewer there if you want
a human in the loop.

Because the migrator cannot roll anything back, the workflow **refuses to run
if `schema.sql` contains `DROP`, `TRUNCATE`, `DELETE` or `ALTER`**. When the
schema genuinely needs one of those, either apply it by hand or re-run the
workflow manually with `allow_destructive` enabled — and treat that as the
signal to replace this bootstrap with a real migration tool.

## Quality gates

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:ci
```

See [AGENTS.md](AGENTS.md) for conventions.
