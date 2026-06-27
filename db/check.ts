import sql from '../lib/db'

async function run() {
  const users = await sql`SELECT id, username, role FROM users ORDER BY id`
  console.log('Users:', JSON.stringify(users))

  const entries = await sql`
    SELECT user_id, date::text, 'sport' as track FROM entries_sport
    UNION ALL SELECT user_id, date::text, 'books' FROM entries_books
    UNION ALL SELECT user_id, date::text, 'math' FROM entries_math
    UNION ALL SELECT user_id, date::text, 'english' FROM entries_english
    UNION ALL SELECT user_id, date::text, 'chinese' FROM entries_chinese
    UNION ALL SELECT user_id, date::text, 'swedish' FROM entries_swedish
    UNION ALL SELECT user_id, date::text, 'french' FROM entries_french
    UNION ALL SELECT user_id, date::text, 'science' FROM entries_science
    UNION ALL SELECT user_id, date::text, 'ai_project' FROM entries_ai_project
    UNION ALL SELECT user_id, date::text, language_pair FROM entries_word_pairing
    ORDER BY date DESC LIMIT 20
  `
  console.log('Recent entries:', JSON.stringify(entries))
  await sql.end()
}
run()
