import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, language, entry_text } = await req.json()
  if (!date || !entry_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'diary'`
  const points = settings?.points_per_entry ?? 10

  const [entry] = await sql`
    INSERT INTO entries_diary (user_id, date, language, entry_text, points_awarded)
    VALUES (${userId}, ${date}, ${language ?? 'other'}, ${entry_text}, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}
