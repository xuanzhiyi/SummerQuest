import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, language_pair, words_shown, results, score } = await req.json()
  if (!date || !language_pair || !words_shown || score == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const trackName = `word_${language_pair}`
  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = ${trackName}`
  const basePoints = settings?.points_per_entry ?? 10
  const points = Math.round(basePoints * (score / 100))

  const [entry] = await sql`
    INSERT INTO entries_word_pairing (user_id, date, language_pair, words_shown, results, score, points_awarded)
    VALUES (${userId}, ${date}, ${language_pair}, ${JSON.stringify(words_shown)}, ${JSON.stringify(results)}, ${score}, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const language_pair = searchParams.get('language_pair')
  if (!date || !language_pair) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const userId = parseInt(session.user.id)
  const entries = await sql`
    SELECT * FROM entries_word_pairing
    WHERE user_id = ${userId} AND date = ${date} AND language_pair = ${language_pair}
    ORDER BY created_at ASC
  `
  return NextResponse.json({ entries })
}
