import sql from '../lib/db'

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS entries_diary (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      date          DATE NOT NULL,
      language      TEXT NOT NULL DEFAULT 'other',
      entry_text    TEXT NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 10,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS entries_diary_user_date ON entries_diary(user_id, date)`
  await sql`INSERT INTO track_settings (track, current_level, effort_weight, points_per_entry, daily_target)
            VALUES ('diary', 5, 1.0, 10, 1)
            ON CONFLICT (track) DO NOTHING`
  console.log('Migration 006: created entries_diary table and track_settings row')
  await sql.end()
}
run()
