import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  return session?.user.role === 'admin' ? session : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`SELECT key, value FROM system_settings`
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key as string] = r.value as string
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, value } = await req.json()
  if (!key || value === undefined) return NextResponse.json({ error: 'Missing key/value' }, { status: 400 })
  await sql`INSERT INTO system_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = ${value}`
  return NextResponse.json({ ok: true })
}
