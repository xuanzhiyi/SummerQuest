import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// GET /api/users?family=code — public list for selected family login page (no secrets)
export async function GET(req: NextRequest) {
  const familyCode = req.nextUrl.searchParams.get('family')?.trim().toLowerCase()
  if (!familyCode) return NextResponse.json({ error: 'Missing family code' }, { status: 400 })

  const users = await sql`
    SELECT users.id, users.name, users.role
    FROM users
    JOIN families ON families.id = users.family_id
    WHERE LOWER(families.code) = ${familyCode}
    ORDER BY users.role, users.name
  `
  return NextResponse.json({ users })
}
