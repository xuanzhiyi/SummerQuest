import sql from '../lib/db'

async function run() {
  await sql`ALTER TABLE entries_diary ADD COLUMN IF NOT EXISTS ai_feedback TEXT`
  await sql`ALTER TABLE entries_diary ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

  console.log('Migration 011: added AI feedback fields to entries_diary')
  await sql.end()
}

run()
