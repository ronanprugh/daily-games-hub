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

## Quality gates

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:ci
```

See [AGENTS.md](AGENTS.md) for conventions.
