import sql from '../lib/db'

async function run() {
  const deleted = await sql`DELETE FROM users WHERE role = 'viewer' AND id > 3 RETURNING id`
  console.log('Deleted viewer duplicates:', deleted.map((r) => r.id))
  const remaining = await sql`SELECT id, role FROM users ORDER BY id`
  console.log('Users now:', JSON.stringify(remaining))
  await sql.end()
}
run()
