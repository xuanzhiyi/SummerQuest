-- Migration 002: word pairing quest tables

CREATE TABLE IF NOT EXISTS entries_word_pairing (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  date            DATE NOT NULL,
  language_pair   TEXT NOT NULL, -- 'english_finnish' | 'english_chinese' | 'english_swedish' | 'english_french'
  words_shown     JSONB NOT NULL, -- [{wordId, english, target}]
  results         JSONB,          -- [{wordId, correct}]
  score           NUMERIC(5,2),   -- 0-100, percent correct
  points_awarded  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO track_settings (track, current_level, effort_weight, points_per_entry) VALUES
  ('word_english_finnish', 5, 1.0, 10),
  ('word_english_chinese', 5, 1.0, 10),
  ('word_english_swedish', 5, 1.0, 10),
  ('word_english_french',  5, 1.0, 10)
ON CONFLICT (track) DO NOTHING;
