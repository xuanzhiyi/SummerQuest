import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateText } from '@/lib/ai/client'
import { scienceProblemsPrompt, scienceFeedbackPrompt, extractScore } from '@/lib/ai/prompts'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  const [settings] = await sql`SELECT current_level FROM track_settings WHERE track = 'science' AND child_user_id = ${userId}`
  const level = settings?.current_level ?? 5

  try {
    const problems = await generateText(scienceProblemsPrompt(level))
    return NextResponse.json({ problems, level })
  } catch (e) {
    console.error('AI problem generation failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, ai_problems, child_answers } = await req.json()
  if (!date || !ai_problems || !child_answers) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`
    SELECT points_per_entry, current_level FROM track_settings WHERE track = 'science' AND child_user_id = ${userId}
  `
  const points = settings?.points_per_entry ?? 10
  const level = settings?.current_level ?? 5

  const [entry] = await sql`
    INSERT INTO entries_science (user_id, date, ai_problems, child_answers, points_awarded)
    VALUES (${userId}, ${date}, ${ai_problems}, ${child_answers}, ${points})
    RETURNING *
  `

  let ai_feedback: string | null = null
  let ai_score: number | null = null
  try {
    const raw = await generateText(scienceFeedbackPrompt(ai_problems, child_answers, level))
    const parsed = extractScore(raw)
    ai_feedback = parsed.feedback
    ai_score = parsed.score
    await sql`
      UPDATE entries_science SET ai_feedback = ${ai_feedback}, ai_score = ${ai_score}, updated_at = NOW()
      WHERE id = ${entry.id}
    `
  } catch (e) {
    console.error('AI grading failed:', e)
  }

  return NextResponse.json({ entry: { ...entry, ai_feedback, ai_score }, points_awarded: points })
}
