import sql from '../lib/db'

async function run() {
  await sql`ALTER TABLE entries_finnish_reading ADD COLUMN IF NOT EXISTS topic_used TEXT`
  await sql`ALTER TABLE entries_finnish_reading ADD COLUMN IF NOT EXISTS fluency_attempts JSONB NOT NULL DEFAULT '[]'::jsonb`
  await sql`ALTER TABLE entries_finnish_reading ADD COLUMN IF NOT EXISTS practice_minutes SMALLINT NOT NULL DEFAULT 0`
  await sql`ALTER TABLE entries_finnish_reading ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_finnish_reading_open_session ON entries_finnish_reading (user_id, date) WHERE done = false`

  console.log('Migration 012: Finnish reading passages and fluency attempts are persisted')
  await sql.end()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
