import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'
import { generateText } from '@/lib/ai/client'
import { diaryFeedbackPrompt } from '@/lib/ai/prompts'
import { getConfiguredAiModel } from '@/lib/ai/settings'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, language, entry_text } = await req.json()
  if (!date || !entry_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'diary' AND child_user_id = ${userId}`
  const points = settings?.points_per_entry ?? 10

  const [previousRows, aiModel] = await Promise.all([
    sql`
      SELECT date::text AS date, language, entry_text
      FROM entries_diary
      WHERE user_id = ${userId} AND date < ${date}
      ORDER BY date DESC, created_at DESC
      LIMIT 3
    `,
    getConfiguredAiModel(),
  ])
  const previousEntries = [...previousRows].reverse() as { date: string; language: string; entry_text: string }[]

  const [entry] = await sql`
    INSERT INTO entries_diary (user_id, date, language, entry_text, points_awarded)
    VALUES (${userId}, ${date}, ${language ?? 'other'}, ${entry_text}, ${points})
    RETURNING *
  `

  let ai_feedback: string | null = null
  try {
    ai_feedback = await generateText(diaryFeedbackPrompt(entry_text, language ?? 'other', previousEntries), aiModel)
    await sql`
      UPDATE entries_diary SET ai_feedback = ${ai_feedback}, updated_at = NOW()
      WHERE id = ${entry.id}
    `
  } catch (e) {
    console.error('AI diary review failed:', e)
  }

  return NextResponse.json({ entry: { ...entry, ai_feedback }, points_awarded: points })
}

