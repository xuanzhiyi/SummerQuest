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
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await sql`
    SELECT users.id, users.name, users.role
    FROM users
    JOIN families ON families.id = users.family_id
    WHERE families.code = ${session.user.familyCode}
    ORDER BY users.role, users.name
  `
  const links = await sql`
    SELECT guardian_children.guardian_id, guardian_children.child_id
    FROM guardian_children
    JOIN users guardians ON guardians.id = guardian_children.guardian_id
    JOIN users children ON children.id = guardian_children.child_id
    JOIN families ON families.id = guardians.family_id AND families.id = children.family_id
    WHERE families.code = ${session.user.familyCode}
  `

  return NextResponse.json({ users, links })
}

// POST /api/admin/users — create a user
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, role, pin } = await req.json()
  if (!name || !role || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!['child', 'guardian', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const [family] = await sql`SELECT id FROM families WHERE code = ${session.user.familyCode}`
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

  const pin_hash = await hash(String(pin), 10)
  const [user] = await sql`
    INSERT INTO users (name, role, pin_hash, family_id)
    VALUES (${name}, ${role}, ${pin_hash}, ${family.id})
    RETURNING id, name, role
  `
  return NextResponse.json({ user }, { status: 201 })
}

// PUT /api/admin/users — update name/pin or link/unlink guardian↔child
export async function PUT(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Link action: { action: 'link'|'unlink', guardian_id, child_id }
  if (body.action === 'link') {
    const [sameFamily] = await sql`
      SELECT 1
      FROM users guardian
      JOIN users child ON child.family_id = guardian.family_id
      JOIN families ON families.id = guardian.family_id
      WHERE guardian.id = ${body.guardian_id}
        AND child.id = ${body.child_id}
        AND families.code = ${session.user.familyCode}
    `
    if (!sameFamily) return NextResponse.json({ error: 'Users are not in this family' }, { status: 403 })
    await sql`INSERT INTO guardian_children (guardian_id, child_id) VALUES (${body.guardian_id}, ${body.child_id}) ON CONFLICT DO NOTHING`
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'unlink') {
    await sql`
      DELETE FROM guardian_children
      USING users guardian, families
      WHERE guardian_children.guardian_id = guardian.id
        AND families.id = guardian.family_id
        AND families.code = ${session.user.familyCode}
        AND guardian_children.guardian_id = ${body.guardian_id}
        AND guardian_children.child_id = ${body.child_id}
    `
    return NextResponse.json({ ok: true })
  }

  // Update user: { id, name?, pin? }
  const { id, name, pin } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (pin) {
    const pin_hash = await hash(String(pin), 10)
    await sql`
      UPDATE users SET name = COALESCE(${name ?? null}, name), pin_hash = ${pin_hash}
      FROM families
      WHERE users.id = ${id} AND families.id = users.family_id AND families.code = ${session.user.familyCode}
    `
  } else {
    await sql`
      UPDATE users SET name = COALESCE(${name ?? null}, name)
      FROM families
      WHERE users.id = ${id} AND families.id = users.family_id AND families.code = ${session.user.familyCode}
    `
  }

  const [user] = await sql`
    SELECT users.id, users.name, users.role
    FROM users
    JOIN families ON families.id = users.family_id
    WHERE users.id = ${id} AND families.code = ${session.user.familyCode}
  `
  return NextResponse.json({ user })
}

// DELETE /api/admin/users?id=X — delete a user
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await sql`
    DELETE FROM users
    USING families
    WHERE users.id = ${id}
      AND users.role != 'admin'
      AND families.id = users.family_id
      AND families.code = ${session.user.familyCode}
  `
  return NextResponse.json({ ok: true })
}
