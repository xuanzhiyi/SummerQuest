import sql from '../lib/db'

async function run() {
  await sql`ALTER TABLE entries_chinese ADD COLUMN IF NOT EXISTS audio_key TEXT`
  await sql`ALTER TABLE entries_swedish ADD COLUMN IF NOT EXISTS audio_key TEXT`
  await sql`ALTER TABLE entries_french  ADD COLUMN IF NOT EXISTS audio_key TEXT`
  console.log('Migration 005: added audio_key to reading track tables')
  await sql.end()
}
run()
