import sql from '../lib/db'
import { hash } from 'bcryptjs'

async function run() {
  // 1. Add 'guardian' to users role check, remove 'viewer'
  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`
  await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'child', 'guardian'))`

  // 2. Rename existing viewer → guardian
  await sql`UPDATE users SET role = 'guardian' WHERE role = 'viewer'`

  // 3. Set pin_hash for admin (temp PIN: 1234) — change via admin UI after login
  const adminPin = await hash('1234', 10)
  await sql`UPDATE users SET pin_hash = ${adminPin} WHERE role = 'admin' AND pin_hash IS NULL`

  // 4. Guardian-children junction table
  await sql`
    CREATE TABLE IF NOT EXISTS guardian_children (
      guardian_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      child_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (guardian_id, child_id)
    )
  `

  // 5. Link existing guardian(s) to existing child(ren)
  await sql`
    INSERT INTO guardian_children (guardian_id, child_id)
    SELECT g.id, c.id
    FROM users g, users c
    WHERE g.role = 'guardian' AND c.role = 'child'
    ON CONFLICT DO NOTHING
  `

  // 6. Add child_user_id to track_settings (nullable first, then populate)
  await sql`ALTER TABLE track_settings ADD COLUMN IF NOT EXISTS child_user_id INTEGER REFERENCES users(id)`

  // 7. For each child, ensure all existing track rows exist
  const children = await sql`SELECT id FROM users WHERE role = 'child'`
  const existingRows = await sql`SELECT track, child_user_id FROM track_settings WHERE child_user_id IS NOT NULL`
  const existingSet = new Set(existingRows.map(r => `${r.track}:${r.child_user_id}`))

  const templateRows = await sql`SELECT * FROM track_settings WHERE child_user_id IS NULL`

  for (const child of children) {
    for (const row of templateRows) {
      const key = `${row.track}:${child.id}`
      if (!existingSet.has(key)) {
        await sql`
          INSERT INTO track_settings (track, child_user_id, current_level, effort_weight, points_per_entry, daily_target)
          VALUES (${row.track}, ${child.id}, ${row.current_level}, ${row.effort_weight}, ${row.points_per_entry}, ${row.daily_target})
          ON CONFLICT DO NOTHING
        `
      }
    }
  }

  // 8. Drop old template rows (child_user_id IS NULL)
  await sql`DELETE FROM track_settings WHERE child_user_id IS NULL`

  // 9. Make child_user_id NOT NULL and update primary key
  await sql`ALTER TABLE track_settings ALTER COLUMN child_user_id SET NOT NULL`
  await sql`ALTER TABLE track_settings DROP CONSTRAINT IF EXISTS track_settings_pkey`
  await sql`ALTER TABLE track_settings ADD PRIMARY KEY (track, child_user_id)`

  // 10. System settings table
  await sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `
  await sql`INSERT INTO system_settings (key, value) VALUES ('ai_model', 'gemini-3.1-flash-lite-preview') ON CONFLICT DO NOTHING`

  console.log('Migration 007 complete.')
  console.log('  - viewer → guardian role renamed')
  console.log('  - guardian_children junction table created + populated')
  console.log('  - track_settings is now per-child (child_user_id)')
  console.log('  - system_settings created (ai_model)')
  console.log('  - Admin PIN set to: 1234 (change via admin UI)')

  await sql.end()
}
run()
