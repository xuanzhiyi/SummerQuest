import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// PUT /api/settings — update a single track_settings row for a specific child
// Admin can update any child; guardian can only update their linked children
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { track, child_user_id, current_level, effort_weight, points_per_entry, daily_target, daily_point_cap } = await req.json()
  if (!track || !child_user_id) return NextResponse.json({ error: 'Missing track or child_user_id' }, { status: 400 })

  // Guardian can only edit settings for their linked children
  if (session.user.role === 'guardian') {
    if (!session.user.childIds?.includes(Number(child_user_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const [updated] = await sql`
    UPDATE track_settings SET
      current_level    = COALESCE(${current_level ?? null}, current_level),
      effort_weight    = COALESCE(${effort_weight ?? null}, effort_weight),
      points_per_entry = COALESCE(${points_per_entry ?? null}, points_per_entry),
      daily_target     = COALESCE(${daily_target ?? null}, daily_target),
      daily_point_cap  = COALESCE(${daily_point_cap ?? null}, daily_point_cap),
      updated_at       = NOW()
    WHERE track = ${track} AND child_user_id = ${child_user_id}
    RETURNING *
  `
  if (!updated) return NextResponse.json({ error: 'Track not found' }, { status: 404 })

  return NextResponse.json({ settings: updated })
}
