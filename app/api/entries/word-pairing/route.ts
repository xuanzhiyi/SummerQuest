import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, language_pair, words_shown, results } = await req.json()
  if (!date || !language_pair || !Array.isArray(words_shown) || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const trackName = `word_${language_pair}`
  const [settings] = await sql`SELECT points_per_entry, daily_point_cap FROM track_settings WHERE track = ${trackName} AND child_user_id = ${userId}`
  const basePoints = settings?.points_per_entry ?? 10
  const shownIds = new Set(words_shown.map((word: Record<string, unknown>) => String(word.wordId)))
  const normalizedResults = results
    .filter((result: Record<string, unknown>) => shownIds.has(String(result.wordId)) && shownIds.has(String(result.selectedWordId)))
    .map((result: Record<string, unknown>) => {
      const wordId = String(result.wordId)
      const selectedWordId = String(result.selectedWordId)
      return { wordId, selectedWordId, correct: wordId === selectedWordId }
    })

  if (normalizedResults.length !== words_shown.length) {
    return NextResponse.json({ error: 'Invalid results' }, { status: 400 })
  }

  const correctCount = normalizedResults.filter((result) => result.correct).length
  const score = Math.round((correctCount / words_shown.length) * 100)
  const earnedRaw = score === 100 ? basePoints : 0

  // Enforce daily point cap if set
  let points = earnedRaw
  if (settings?.daily_point_cap != null) {
    const [totRow] = await sql`
      SELECT COALESCE(SUM(points_awarded), 0) AS total
      FROM entries_word_pairing
      WHERE user_id = ${userId} AND date = ${date} AND language_pair = ${language_pair}
    `
    const alreadyEarned = Number(totRow.total)
    const remaining = Math.max(0, settings.daily_point_cap - alreadyEarned)
    points = Math.min(earnedRaw, remaining)
  }

  const [entry] = await sql`
    INSERT INTO entries_word_pairing (user_id, date, language_pair, words_shown, results, score, points_awarded)
    VALUES (${userId}, ${date}, ${language_pair}, ${JSON.stringify(words_shown)}, ${JSON.stringify(normalizedResults)}, ${score}, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points, score })
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
