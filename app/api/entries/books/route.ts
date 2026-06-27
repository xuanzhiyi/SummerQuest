import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateText } from '@/lib/ai/client'
import { bookFollowUpPrompt } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, title, notes } = await req.json()
  if (!date || !title || !notes) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'books' AND child_user_id = ${userId}`
  const points = settings?.points_per_entry ?? 10

  // Save entry first so child can see it even if AI call fails
  const [entry] = await sql`
    INSERT INTO entries_books (user_id, date, title, notes, points_awarded)
    VALUES (${userId}, ${date}, ${title}, ${notes}, ${points})
    RETURNING *
  `

  // Generate follow-up question (non-blocking â€” failure doesn't break the save)
  let ai_question: string | null = null
  try {
    ai_question = await generateText(bookFollowUpPrompt(title, notes))
    await sql`UPDATE entries_books SET ai_question = ${ai_question} WHERE id = ${entry.id}`
  } catch (e) {
    console.error('AI follow-up generation failed:', e)
  }

  return NextResponse.json({ entry: { ...entry, ai_question }, points_awarded: points })
}

// PUT /api/entries/books â€” save child's answer to the AI follow-up question
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, ai_answer } = await req.json()
  if (!id || !ai_answer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const userId = parseInt(session.user.id)
  const [entry] = await sql`
    UPDATE entries_books SET ai_answer = ${ai_answer}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ entry })
}
