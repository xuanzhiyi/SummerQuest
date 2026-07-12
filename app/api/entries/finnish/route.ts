import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'
import { generateText } from '@/lib/ai/client'
import { finnishFeedbackPrompt, extractScore } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, paragraph, prompt_used } = await req.json()
  if (!date || !paragraph) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings, aiModelSetting] = await Promise.all([
    sql`SELECT points_per_entry, current_level FROM track_settings WHERE track = 'finnish' AND child_user_id = ${userId}`,
    sql`SELECT value FROM system_settings WHERE key = 'ai_model'`,
  ])
  const [trackSettings] = settings
  const [aiModelRow] = aiModelSetting
  const points = trackSettings?.points_per_entry ?? 10
  const level = trackSettings?.current_level ?? 5
  const aiModel = String(aiModelRow?.value ?? 'gemini-3.1-flash-lite-preview')

  const previousEntries = [...await sql`
    SELECT date::text AS date, prompt_used, paragraph, ai_score
    FROM entries_finnish
    WHERE user_id = ${userId} AND date < ${date}
    ORDER BY date DESC, created_at DESC
    LIMIT 3
  `].reverse() as { date: string; prompt_used: string | null; paragraph: string; ai_score: string | number | null }[]

  const [entry] = await sql`
    INSERT INTO entries_finnish (user_id, date, paragraph, prompt_used, points_awarded)
    VALUES (${userId}, ${date}, ${paragraph}, ${prompt_used ?? null}, ${points})
    RETURNING *
  `

  let ai_feedback: string | null = null
  let ai_score: number | null = null
  try {
    const raw = await generateText(finnishFeedbackPrompt(paragraph, prompt_used ?? '', level, previousEntries), aiModel)
    const parsed = extractScore(raw)
    ai_feedback = parsed.feedback
    ai_score = parsed.score
    await sql`
      UPDATE entries_finnish SET ai_feedback = ${ai_feedback}, ai_score = ${ai_score}, updated_at = NOW()
      WHERE id = ${entry.id}
    `
  } catch (e) {
    console.error('AI grading failed:', e)
  }

  return NextResponse.json({ entry: { ...entry, ai_feedback, ai_score }, points_awarded: points })
}
