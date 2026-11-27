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
