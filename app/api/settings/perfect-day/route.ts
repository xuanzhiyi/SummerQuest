import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// PUT /api/settings/perfect-day — set how many completed quests counts as a "perfect day" for a child
// Admin can update any child; guardian can only update their linked children
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { child_user_id, perfect_day_threshold } = await req.json()
  if (!child_user_id || perfect_day_threshold == null) {
    return NextResponse.json({ error: 'Missing child_user_id or perfect_day_threshold' }, { status: 400 })
  }

  if (session.user.role === 'guardian') {
    if (!session.user.childIds?.includes(Number(child_user_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const [updated] = await sql`
    UPDATE users SET perfect_day_threshold = ${perfect_day_threshold}
    WHERE id = ${child_user_id} AND role = 'child'
    RETURNING id, perfect_day_threshold
  `
  if (!updated) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  return NextResponse.json({ user: updated })
}
