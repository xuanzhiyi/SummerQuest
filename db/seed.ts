// Run with: npx tsx db/seed.ts
// Seeds the 3 user accounts. Edit values here before first run.
// WARNING: Re-running will attempt INSERT and skip duplicates (ON CONFLICT DO NOTHING).

import { hash } from 'bcryptjs'
import sql from '../lib/db'

async function seed() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'change-me-admin'
  const childPin = process.env.SEED_CHILD_PIN || '1234'
  const viewerPin = process.env.SEED_VIEWER_PIN || '5678'

  const adminHash = await hash(adminPassword, 12)
  const childHash = await hash(childPin, 12)
  const viewerHash = await hash(viewerPin, 12)

  await sql`
    INSERT INTO users (name, role, email, password_hash)
    VALUES ('Admin', 'admin', 'admin@summerquest.local', ${adminHash})
    ON CONFLICT (email) DO NOTHING
  `

  await sql`
    INSERT INTO users (name, role, username, pin_hash)
    VALUES ('Hansen', 'child', 'hansen', ${childHash})
    ON CONFLICT (username) DO NOTHING
  `

  await sql`
    INSERT INTO users (name, role, pin_hash)
    VALUES ('Grandparents', 'viewer', ${viewerHash})
    ON CONFLICT DO NOTHING
  `

  console.log('✓ Seeded users')
  console.log('  Admin:    admin@summerquest.local / ', adminPassword)
  console.log('  Child:    aleksi / PIN', childPin)
  console.log('  Viewer:   PIN', viewerPin)

  await sql.end()
}

seed().catch((e) => { console.error(e); process.exit(1) })
