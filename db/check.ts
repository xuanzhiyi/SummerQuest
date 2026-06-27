import sql from '../lib/db'

async function run() {
  const settings = await sql`SELECT track, current_level, points_per_entry, daily_target FROM track_settings WHERE track LIKE 'word_%' ORDER BY track`
  console.log('Word pairing settings:', JSON.stringify(settings, null, 2))
  await sql.end()
}
run()
