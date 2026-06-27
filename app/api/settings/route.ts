import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// PUT /api/settings — update a single track_settings row
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { track, current_level, effort_weight, points_per_entry, daily_target } = await req.json()
  if (!track) return NextResponse.json({ error: 'Missing track' }, { status: 400 })

  const [updated] = await sql`
    UPDATE track_settings SET
      current_level    = COALESCE(${current_level ?? null}, current_level),
      effort_weight    = COALESCE(${effort_weight ?? null}, effort_weight),
      points_per_entry = COALESCE(${points_per_entry ?? null}, points_per_entry),
      daily_target     = COALESCE(${daily_target ?? null}, daily_target),
      updated_at       = NOW()
    WHERE track = ${track}
    RETURNING *
  `
  if (!updated) return NextResponse.json({ error: 'Track not found' }, { status: 404 })

  return NextResponse.json({ settings: updated })
}
