import sql from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

const migration = readFileSync(join(process.cwd(), 'db/migrations/002_word_pairing.sql'), 'utf8')
sql.unsafe(migration)
  .then(() => { console.log('Migration 002 applied'); return sql.end() })
  .catch((e: Error) => { console.error('Failed:', e.message); process.exit(1) })
