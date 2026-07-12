import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'
import { generateText } from '@/lib/ai/client'
import { swedishReadingPrompt } from '@/lib/ai/prompts'
import { getConfiguredAiModel } from '@/lib/ai/settings'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  const [settings] = await sql`SELECT current_level FROM track_settings WHERE track = 'swedish' AND child_user_id = ${userId}`
  const level = settings?.current_level ?? 5
  const aiModel = await getConfiguredAiModel()

  try {
    const text = await generateText(swedishReadingPrompt(level), aiModel)
    return NextResponse.json({ text, level })
  } catch (e) {
    console.error('AI text generation failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, ai_generated_text, level_at_time, audio_key } = await req.json()
  if (!date || !ai_generated_text || level_at_time == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'swedish' AND child_user_id = ${userId}`
  const points = settings?.points_per_entry ?? 10

  const [entry] = await sql`
    INSERT INTO entries_swedish (user_id, date, ai_generated_text, level_at_time, done, points_awarded, audio_key)
    VALUES (${userId}, ${date}, ${ai_generated_text}, ${level_at_time}, true, ${points}, ${audio_key ?? null})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}

// PATCH â€” update audio_key on an existing entry (re-record, no XP change)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, audio_key } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const userId = parseInt(session.user.id)
  const [entry] = await sql`
    UPDATE entries_swedish SET audio_key = ${audio_key ?? null}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ entry })
}
