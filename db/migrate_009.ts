import sql from '../lib/db'

async function run() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS perfect_day_threshold INTEGER`
  console.log('Migration 009 complete: users.perfect_day_threshold added')
  await sql.end()
}
run()
