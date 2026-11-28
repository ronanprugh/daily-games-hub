-- Daily Games Hub schema.
--
-- Multi-user: every result belongs to a user, so the thread can all keep
-- their own stats against the same catalogue of games.

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  username    TEXT NOT NULL,
  -- Case-insensitive uniqueness without making the stored name lowercase:
  -- people should see the capitalisation they chose.
  username_ci TEXT NOT NULL UNIQUE,
  -- scrypt, as "scrypt$N$r$p$<salt-b64>$<hash-b64>". Never a raw password.
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  -- SHA-256 of the cookie token, never the token itself: a leaked database
  -- must not hand out working sessions.
  token_hash  TEXT PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS entries (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- The game's slug from src/data/games.ts. Deliberately NOT a foreign key:
  -- the catalogue is code, so it can be edited in a PR and reviewed, and a
  -- renamed game does not need a migration to stay readable.
  game_slug   TEXT NOT NULL,
  played_on   DATE NOT NULL,
  -- Did it get finished? A failed Wordle is played-but-not-solved, which is
  -- a different thing from not playing, and both matter to a streak.
  solved      BOOLEAN NOT NULL DEFAULT TRUE,
  -- The comparable number, normalised per the game's `scoring.kind`:
  -- guesses used, points, seconds, metres/km, moves over par, mistakes.
  -- NULL for kind "done", or for a failed attempt with no number.
  score       NUMERIC,
  -- Exactly what the user typed, kept so nothing is lost to normalisation.
  raw         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One result per game per day per person. Re-submitting edits that row.
  UNIQUE (user_id, game_slug, played_on)
);
CREATE INDEX IF NOT EXISTS entries_user_date_idx ON entries(user_id, played_on DESC);
CREATE INDEX IF NOT EXISTS entries_user_game_idx ON entries(user_id, game_slug, played_on DESC);

-- ---------------------------------------------------------------------------
-- games + scores (replaces `entries`, which is left in place and unused: the
-- migrate workflow refuses DROP by design, so retiring it is a manual step).
-- ---------------------------------------------------------------------------

-- One row per game. NOT hand-edited: db/migrate.mts upserts it from
-- src/data/games.ts on every run, so the catalogue stays reviewed code while
-- the database can still join on it and enforce game_id.
CREATE TABLE IF NOT EXISTS games (
  id               TEXT PRIMARY KEY,          -- the slug, e.g. 'wordle'
  name             TEXT NOT NULL,
  url              TEXT NOT NULL,
  category         TEXT NOT NULL,
  -- What `scores.points` counts: guesses | points | seconds | mistakes |
  -- strokes (over par) | done.
  scoring_unit     TEXT NOT NULL,
  lower_is_better  BOOLEAN NOT NULL,
  -- Best result anyone could post. NULL when unbounded (a crossword time).
  best_points      NUMERIC,
  -- The cap at the other end: 6 for Wordle, 0 for Krillion. NULL if none.
  worst_points     NUMERIC,
  -- Whether a play can end unsolved (Wordle X/6). Drives the "solved" stat.
  can_fail         BOOLEAN NOT NULL,
  -- Suffix the UI shows after the number: 'm', 'km'. NULL for none.
  display_unit     TEXT,
  -- True when pasting the game's share text works, not only a typed score.
  has_share_parser BOOLEAN NOT NULL,
  -- True when the share format AND what its number means are confirmed.
  verified         BOOLEAN NOT NULL,
  sort_order       INTEGER NOT NULL,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scores (
  id           BIGSERIAL PRIMARY KEY,
  player_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id      TEXT NOT NULL REFERENCES games(id),
  date_played  DATE NOT NULL,
  -- In the game's own scoring_unit. NULL for an unsolved play with no number.
  points       NUMERIC,
  -- A failed Wordle is played-but-not-solved: it keeps a streak alive, but
  -- must not count toward "best" or "average".
  solved       BOOLEAN NOT NULL DEFAULT TRUE,
  -- The emoji grid as shared. UTF-8 TEXT stores emoji, keycaps and ZWJ
  -- sequences byte-for-byte.
  board        TEXT,
  -- The whole paste. If a parser turns out to have misread a game, points
  -- can be re-derived from this instead of being lost.
  raw          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, game_id, date_played)
);
CREATE INDEX IF NOT EXISTS scores_player_date_idx ON scores(player_id, date_played DESC);
CREATE INDEX IF NOT EXISTS scores_player_game_idx ON scores(player_id, game_id, date_played DESC);
CREATE INDEX IF NOT EXISTS scores_game_date_idx ON scores(game_id, date_played DESC);
