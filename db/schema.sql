-- SummerQuest database schema
-- Run migrations in order via: psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'child', 'viewer')),
  username    TEXT UNIQUE,         -- used by child (username+PIN login)
  pin_hash    TEXT,                -- hashed PIN for child and viewer
  email       TEXT UNIQUE,         -- used by admin (email+password login)
  password_hash TEXT,              -- hashed password for admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-subject settings: difficulty level, effort weight (AI-graded subjects only), points per entry
CREATE TABLE IF NOT EXISTS track_settings (
  track           TEXT PRIMARY KEY,  -- 'books','english','finnish','chinese','swedish','french','math','science','ai_project','sport'
  current_level   INT NOT NULL DEFAULT 5,   -- 1-10, used in AI prompts
  effort_weight   NUMERIC(4,2) DEFAULT 1.0, -- only meaningful for english/finnish/math/science
  points_per_entry INT NOT NULL DEFAULT 10,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward thresholds per track
CREATE TABLE IF NOT EXISTS reward_thresholds (
  id                SERIAL PRIMARY KEY,
  track             TEXT NOT NULL,
  points_required   INT NOT NULL,
  reward_description TEXT NOT NULL,
  requested_at      TIMESTAMPTZ,     -- set when child requests redemption
  fulfilled_at      TIMESTAMPTZ,     -- set when admin marks fulfilled
  dismissed_at      TIMESTAMPTZ,     -- set when admin dismisses (e.g. accidental request)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Books entries
CREATE TABLE IF NOT EXISTS entries_books (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  title           TEXT NOT NULL,
  notes           TEXT NOT NULL,
  ai_question     TEXT,             -- AI-generated follow-up question
  ai_answer       TEXT,             -- child's answer to the question
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- English writing entries
CREATE TABLE IF NOT EXISTS entries_english (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  paragraph       TEXT NOT NULL,
  prompt_used     TEXT,             -- the writing prompt shown to child
  ai_feedback     TEXT,             -- written feedback from AI
  ai_score        NUMERIC(5,2),     -- internal 0-100 score, never shown to child/viewer
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Finnish writing entries
CREATE TABLE IF NOT EXISTS entries_finnish (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  paragraph       TEXT NOT NULL,
  prompt_used     TEXT,
  ai_feedback     TEXT,
  ai_score        NUMERIC(5,2),
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chinese reading entries
CREATE TABLE IF NOT EXISTS entries_chinese (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  ai_generated_text TEXT NOT NULL,  -- the text AI generated for this session
  level_at_time   INT NOT NULL,     -- snapshot of level when text was generated
  done            BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Swedish reading entries
CREATE TABLE IF NOT EXISTS entries_swedish (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  ai_generated_text TEXT NOT NULL,
  level_at_time   INT NOT NULL,
  done            BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- French reading entries
CREATE TABLE IF NOT EXISTS entries_french (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  ai_generated_text TEXT NOT NULL,
  level_at_time   INT NOT NULL,
  done            BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Math entries
CREATE TABLE IF NOT EXISTS entries_math (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  ai_problems     TEXT NOT NULL,    -- the problems AI generated
  child_answers   TEXT,             -- child's submitted answers
  ai_feedback     TEXT,             -- overall written feedback
  ai_score        NUMERIC(5,2),
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Science entries
CREATE TABLE IF NOT EXISTS entries_science (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  ai_problems     TEXT NOT NULL,
  child_answers   TEXT,
  ai_feedback     TEXT,
  ai_score        NUMERIC(5,2),
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI project entries
CREATE TABLE IF NOT EXISTS entries_ai_project (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  caption         TEXT NOT NULL,
  image_key       TEXT,             -- R2 object key
  image_url       TEXT,             -- public/presigned URL (cached)
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sport entries
CREATE TABLE IF NOT EXISTS entries_sport (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  activity        TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default track settings
INSERT INTO track_settings (track, current_level, effort_weight, points_per_entry) VALUES
  ('books',      5, 1.0, 10),
  ('english',    5, 1.5, 10),
  ('finnish',    5, 1.5, 10),
  ('chinese',    5, 1.0, 10),
  ('swedish',    5, 1.0, 10),
  ('french',     5, 1.0, 10),
  ('math',       5, 1.0, 10),
  ('science',    5, 1.0, 10),
  ('ai_project', 5, 1.0, 10),
  ('sport',      5, 1.0, 10)
ON CONFLICT (track) DO NOTHING;
