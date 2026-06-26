import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// Admin marks a redemption request as fulfilled or dismisses it
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { threshold_id, action } = await req.json() // action: 'fulfil' | 'dismiss'
  if (!threshold_id || !['fulfil', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const [updated] = await sql`
    UPDATE reward_thresholds
    SET
      fulfilled_at = CASE WHEN ${action} = 'fulfil' THEN NOW() ELSE fulfilled_at END,
      dismissed_at = CASE WHEN ${action} = 'dismiss' THEN NOW() ELSE dismissed_at END
    WHERE id = ${threshold_id}
    RETURNING *
  `
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ threshold: updated })
}
