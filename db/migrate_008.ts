import sql from '../lib/db'

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS entries_english_reading (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER NOT NULL REFERENCES users(id),
      date             DATE NOT NULL,
      ai_generated_text TEXT NOT NULL,
      level_at_time    INTEGER NOT NULL,
      done             BOOLEAN NOT NULL DEFAULT true,
      points_awarded   INTEGER NOT NULL DEFAULT 0,
      audio_key        TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS entries_finnish_reading (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER NOT NULL REFERENCES users(id),
      date             DATE NOT NULL,
      ai_generated_text TEXT NOT NULL,
      level_at_time    INTEGER NOT NULL,
      done             BOOLEAN NOT NULL DEFAULT true,
      points_awarded   INTEGER NOT NULL DEFAULT 0,
      audio_key        TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Add track_settings rows for all existing children
  const children = await sql`SELECT id FROM users WHERE role = 'child'`
  for (const child of children) {
    await sql`
      INSERT INTO track_settings (track, child_user_id, current_level, effort_weight, points_per_entry, daily_target)
      VALUES
        ('english_reading', ${child.id}, 5, 1.0, 10, 1),
        ('finnish_reading', ${child.id}, 5, 1.0, 10, 1)
      ON CONFLICT DO NOTHING
    `
  }

  console.log('Migration 008 complete: entries_english_reading, entries_finnish_reading created')
  await sql.end()
}
run()
