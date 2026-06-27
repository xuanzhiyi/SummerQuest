import sql from '../lib/db'

async function run() {
  const entries = await sql`
    SELECT 'sport' as t, user_id, date::text, points_awarded FROM entries_sport
    UNION ALL SELECT 'piano', user_id, date::text, points_awarded FROM entries_piano
    UNION ALL SELECT 'math', user_id, date::text, points_awarded FROM entries_math
    UNION ALL SELECT 'word_pair', user_id, date::text, points_awarded FROM entries_word_pairing
    ORDER BY date DESC LIMIT 20
  `
  console.log('entries:', JSON.stringify(entries))
  const users = await sql`SELECT id, username, role FROM users`
  console.log('users:', JSON.stringify(users))
  await sql.end()
}
run()
