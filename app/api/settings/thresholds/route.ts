import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// POST — add a new reward threshold
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { track, points_required, reward_description } = await req.json()
  if (!track || !points_required || !reward_description) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [threshold] = await sql`
    INSERT INTO reward_thresholds (track, points_required, reward_description)
    VALUES (${track}, ${points_required}, ${reward_description})
    RETURNING *
  `
  return NextResponse.json({ threshold })
}

// DELETE — remove a threshold (only if not yet fulfilled/requested)
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const [deleted] = await sql`
    DELETE FROM reward_thresholds
    WHERE id = ${id} AND requested_at IS NULL AND fulfilled_at IS NULL
    RETURNING id
  `
  if (!deleted) {
    return NextResponse.json(
      { error: 'Cannot delete — threshold has pending or fulfilled requests' },
      { status: 409 }
    )
  }
  return NextResponse.json({ deleted: true })
}
