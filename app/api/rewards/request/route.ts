import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { threshold_id } = await req.json()
  if (!threshold_id) return NextResponse.json({ error: 'Missing threshold_id' }, { status: 400 })

  const userId = parseInt(session.user.id)

  // Verify the child has actually reached this threshold
  const [threshold] = await sql`SELECT * FROM reward_thresholds WHERE id = ${threshold_id}`
  if (!threshold) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (threshold.requested_at) return NextResponse.json({ error: 'Already requested' }, { status: 409 })
  if (threshold.fulfilled_at) return NextResponse.json({ error: 'Already fulfilled' }, { status: 409 })

  // Verify points
  const track = threshold.track as string
  const table = `entries_${track}`
  const [row] = await sql.unsafe(
    `SELECT COUNT(*) AS cnt FROM ${table} WHERE user_id = $1`,
    [userId]
  )
  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = ${track}`
  const total = Number(row.cnt) * Number(settings?.points_per_entry ?? 10)

  if (total < threshold.points_required) {
    return NextResponse.json({ error: 'Points threshold not reached' }, { status: 403 })
  }

  const [updated] = await sql`
    UPDATE reward_thresholds SET requested_at = NOW() WHERE id = ${threshold_id}
    RETURNING *
  `

  return NextResponse.json({ threshold: updated })
}
