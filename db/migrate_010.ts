import sql from '../lib/db'

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS families (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  const defaultCode = process.env.DEFAULT_FAMILY_CODE || 'summerquest'
  const defaultName = process.env.DEFAULT_FAMILY_NAME || 'SummerQuest Family'

  const [family] = await sql`
    INSERT INTO families (code, name)
    VALUES (${defaultCode}, ${defaultName})
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_id INTEGER REFERENCES families(id)`
  await sql`UPDATE users SET family_id = ${family.id} WHERE family_id IS NULL`
  await sql`ALTER TABLE users ALTER COLUMN family_id SET NOT NULL`
  await sql`CREATE INDEX IF NOT EXISTS idx_users_family_role_name ON users(family_id, role, LOWER(name))`

  console.log(`Migration 010 complete: families added; existing users assigned to family code "${defaultCode}".`)
  await sql.end()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
