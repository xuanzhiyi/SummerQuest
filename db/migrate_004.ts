import sql from '../lib/db'

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS entries_piano (
      id               SERIAL PRIMARY KEY,
      user_id          INT NOT NULL REFERENCES users(id),
      date             DATE NOT NULL,
      piece            TEXT NOT NULL,
      duration_minutes INT NOT NULL,
      points_awarded   INT NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    INSERT INTO track_settings (track, current_level, effort_weight, points_per_entry)
    VALUES ('piano', 5, 1.0, 10)
    ON CONFLICT (track) DO NOTHING
  `
  console.log('Migration 004 applied')
  await sql.end()
}

run().catch((e: Error) => { console.error(e.message); process.exit(1) })
