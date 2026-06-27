import sql from '../lib/db'

async function run() {
  await sql`UPDATE track_settings SET daily_target = 3 WHERE track LIKE 'word_%'`
  const rows = await sql`SELECT track, daily_target FROM track_settings WHERE track LIKE 'word_%' ORDER BY track`
  console.log(JSON.stringify(rows, null, 2))
  await sql.end()
}
run()
