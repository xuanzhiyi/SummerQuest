import sql from '../lib/db'

async function run() {
  await sql`
    ALTER TABLE track_settings
    ADD COLUMN IF NOT EXISTS daily_target INT NOT NULL DEFAULT 1
  `
  // Only set default if not already customised (don't overwrite admin changes)
  await sql`
    UPDATE track_settings
    SET daily_target = 2
    WHERE track IN ('word_english_finnish','word_english_chinese','word_english_swedish','word_english_french')
      AND daily_target = 1
  `
  console.log('Migration 003 applied')
  await sql.end()
}

run().catch((e: Error) => { console.error(e.message); process.exit(1) })
