import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { getEntryTableForSettingsTrack } from '@/lib/tracks'

async function getAwardedPoints(userId: number, track: string): Promise<number> {
  if (track.startsWith('word_')) {
    const languagePair = track.replace('word_', '')
    const [row] = await sql`
      SELECT COALESCE(SUM(points_awarded), 0) AS total
      FROM entries_word_pairing
      WHERE user_id = ${userId} AND language_pair = ${languagePair}
    `
    return Number(row.total)
  }

  const table = getEntryTableForSettingsTrack(track)
  if (!table) return 0

  const [row] = await sql.unsafe(
    `SELECT COALESCE(SUM(points_awarded), 0) AS total FROM ${table} WHERE user_id = $1`,
    [userId]
  )
  return Number(row.total)
}

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

  const track = threshold.track as string
  const total = await getAwardedPoints(userId, track)

  if (total < threshold.points_required) {
    return NextResponse.json({ error: 'Points threshold not reached' }, { status: 403 })
  }

  const [updated] = await sql`
    UPDATE reward_thresholds SET requested_at = NOW() WHERE id = ${threshold_id}
    RETURNING *
  `

  return NextResponse.json({ threshold: updated })
}
