import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateText } from '@/lib/ai/client'
import { frenchReadingPrompt } from '@/lib/ai/prompts'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [settings] = await sql`SELECT current_level FROM track_settings WHERE track = 'french'`
  const level = settings?.current_level ?? 5

  try {
    const text = await generateText(frenchReadingPrompt(level))
    return NextResponse.json({ text, level })
  } catch (e) {
    console.error('AI text generation failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, ai_generated_text, level_at_time } = await req.json()
  if (!date || !ai_generated_text || level_at_time == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'french'`
  const points = settings?.points_per_entry ?? 10

  const [entry] = await sql`
    INSERT INTO entries_french (user_id, date, ai_generated_text, level_at_time, done, points_awarded)
    VALUES (${userId}, ${date}, ${ai_generated_text}, ${level_at_time}, true, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}
