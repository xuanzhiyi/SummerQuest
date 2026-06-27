import { NextResponse } from 'next/server'
import sql from '@/lib/db'

// GET /api/users — public list for login page (id, name, role only — no secrets)
export async function GET() {
  const users = await sql`SELECT id, name, role FROM users ORDER BY role, name`
  return NextResponse.json({ users })
}
