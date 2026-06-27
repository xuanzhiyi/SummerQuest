import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, piece, duration_minutes } = await req.json()
  if (!date || !piece || !duration_minutes) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'piano' AND child_user_id = ${userId}`
  const points = settings?.points_per_entry ?? 10

  const [entry] = await sql`
    INSERT INTO entries_piano (user_id, date, piece, duration_minutes, points_awarded)
    VALUES (${userId}, ${date}, ${piece}, ${duration_minutes}, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}

// PATCH â€” attach audio_key to an existing entry
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, audio_key } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const userId = parseInt(session.user.id)
  const [entry] = await sql`
    UPDATE entries_piano SET audio_key = ${audio_key ?? null}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ entry })
}

