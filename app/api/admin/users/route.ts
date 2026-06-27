import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import sql from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return null
  return session
}

// GET /api/admin/users — list all users with their guardian/child links
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await sql`SELECT id, name, role FROM users ORDER BY role, name`
  const links = await sql`SELECT guardian_id, child_id FROM guardian_children`

  return NextResponse.json({ users, links })
}

// POST /api/admin/users — create a user
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, role, pin } = await req.json()
  if (!name || !role || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!['child', 'guardian', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const pin_hash = await hash(String(pin), 10)
  const [user] = await sql`
    INSERT INTO users (name, role, pin_hash) VALUES (${name}, ${role}, ${pin_hash}) RETURNING id, name, role
  `
  return NextResponse.json({ user }, { status: 201 })
}

// PUT /api/admin/users — update name/pin or link/unlink guardian↔child
export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Link action: { action: 'link'|'unlink', guardian_id, child_id }
  if (body.action === 'link') {
    await sql`INSERT INTO guardian_children (guardian_id, child_id) VALUES (${body.guardian_id}, ${body.child_id}) ON CONFLICT DO NOTHING`
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'unlink') {
    await sql`DELETE FROM guardian_children WHERE guardian_id = ${body.guardian_id} AND child_id = ${body.child_id}`
    return NextResponse.json({ ok: true })
  }

  // Update user: { id, name?, pin? }
  const { id, name, pin } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (pin) {
    const pin_hash = await hash(String(pin), 10)
    await sql`UPDATE users SET name = COALESCE(${name ?? null}, name), pin_hash = ${pin_hash} WHERE id = ${id}`
  } else {
    await sql`UPDATE users SET name = COALESCE(${name ?? null}, name) WHERE id = ${id}`
  }

  const [user] = await sql`SELECT id, name, role FROM users WHERE id = ${id}`
  return NextResponse.json({ user })
}

// DELETE /api/admin/users?id=X — delete a user
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await sql`DELETE FROM users WHERE id = ${id} AND role != 'admin'`
  return NextResponse.json({ ok: true })
}
