import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateText } from '@/lib/ai/client'
import { englishFeedbackPrompt, extractScore } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, paragraph, prompt_used } = await req.json()
  if (!date || !paragraph) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`
    SELECT points_per_entry, current_level FROM track_settings WHERE track = 'english' AND child_user_id = ${userId}
  `
  const points = settings?.points_per_entry ?? 10
  const level = settings?.current_level ?? 5

  // Save entry immediately
  const [entry] = await sql`
    INSERT INTO entries_english (user_id, date, paragraph, prompt_used, points_awarded)
    VALUES (${userId}, ${date}, ${paragraph}, ${prompt_used ?? null}, ${points})
    RETURNING *
  `

  // Grade with AI
  let ai_feedback: string | null = null
  let ai_score: number | null = null
  try {
    const raw = await generateText(englishFeedbackPrompt(paragraph, prompt_used ?? '', level))
    const parsed = extractScore(raw)
    ai_feedback = parsed.feedback
    ai_score = parsed.score
    await sql`
      UPDATE entries_english SET ai_feedback = ${ai_feedback}, ai_score = ${ai_score}, updated_at = NOW()
      WHERE id = ${entry.id}
    `
  } catch (e) {
    console.error('AI grading failed:', e)
  }

  return NextResponse.json({ entry: { ...entry, ai_feedback, ai_score }, points_awarded: points })
}
