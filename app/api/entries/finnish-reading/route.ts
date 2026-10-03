import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'
import { generateText } from '@/lib/ai/client'
import { finnishReadingPrompt } from '@/lib/ai/prompts'
import { getConfiguredAiModel } from '@/lib/ai/settings'
import { randomReadingTopic, withReadingTopic } from '@/lib/reading-topics'
import { createFluencyAttempt, REQUIRED_FLUENCY_ATTEMPTS } from '@/lib/finnish-fluency'

async function getRecentSessions(userId: number, beforeDate: string) {
  return [...await sql`
    SELECT date::text AS date, fluency_attempts, practice_minutes
    FROM entries_finnish_reading
    WHERE user_id = ${userId}
      AND date < ${beforeDate}
      AND done = true
      AND jsonb_array_length(fluency_attempts) > 0
    ORDER BY date DESC, created_at DESC
    LIMIT 5
  `]
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid practice date is required' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only start today’s practice' }, { status: 403 })
  }

  const [existing] = await sql`
    SELECT id, date::text AS date, ai_generated_text, level_at_time, fluency_attempts, done
    FROM entries_finnish_reading
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY created_at DESC
    LIMIT 1
  `
  const history = await getRecentSessions(userId, date)

  if (existing) {
    if (existing.done) {
      return NextResponse.json({ error: 'Finnish reading is already logged for this date' }, { status: 409 })
    }
    return NextResponse.json({
      text: existing.ai_generated_text,
      level: existing.level_at_time,
      draftId: existing.id,
      attempts: existing.fluency_attempts,
      history,
    })
  }

  const [settings] = await sql`
    SELECT current_level FROM track_settings
    WHERE track = 'finnish_reading' AND child_user_id = ${userId}
  `
  const level = settings?.current_level ?? 5
  const recentTopics = [...await sql`
    SELECT topic_used
    FROM entries_finnish_reading
    WHERE user_id = ${userId} AND topic_used IS NOT NULL
    ORDER BY date DESC, created_at DESC
    LIMIT 10
  `].map((row) => String(row.topic_used))

  try {
    const topic = randomReadingTopic(recentTopics)
    const aiModel = await getConfiguredAiModel()
    const text = await generateText(withReadingTopic(finnishReadingPrompt(level), topic), aiModel)
    const [draft] = await sql`
      INSERT INTO entries_finnish_reading
        (user_id, date, ai_generated_text, level_at_time, topic_used, done, points_awarded)
      VALUES (${userId}, ${date}, ${text}, ${level}, ${topic}, false, 0)
      ON CONFLICT (user_id, date) WHERE done = false DO NOTHING
      RETURNING id
    `
    if (!draft) {
      const [savedDraft] = await sql`
        SELECT id, ai_generated_text, level_at_time, fluency_attempts
        FROM entries_finnish_reading
        WHERE user_id = ${userId} AND date = ${date} AND done = false
        ORDER BY created_at DESC
        LIMIT 1
      `
      if (!savedDraft) {
        return NextResponse.json({ error: 'Reading practice was completed in another session' }, { status: 409 })
      }
      return NextResponse.json({
        text: savedDraft.ai_generated_text,
        level: savedDraft.level_at_time,
        draftId: savedDraft.id,
        attempts: savedDraft.fluency_attempts,
        history,
      })
    }
    return NextResponse.json({ text, level, draftId: draft.id, attempts: [], history })
  } catch (e) {
    console.error('Finnish reading passage generation failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, date, attempt_number, duration_seconds, errors } = await req.json()
  if (!Number.isInteger(id) || !date || !Number.isInteger(attempt_number)) {
    return NextResponse.json({ error: 'Missing or invalid reading attempt fields' }, { status: 400 })
  }
  if (attempt_number < 1 || attempt_number > REQUIRED_FLUENCY_ATTEMPTS) {
    return NextResponse.json({ error: 'Invalid reading attempt number' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [draft] = await sql`
    SELECT ai_generated_text FROM entries_finnish_reading
    WHERE id = ${id} AND user_id = ${userId} AND date = ${date} AND done = false
      AND jsonb_array_length(fluency_attempts) = ${attempt_number - 1}
  `
  if (!draft) {
    return NextResponse.json({ error: 'This attempt was already saved or the practice session expired' }, { status: 409 })
  }

  const attempt = createFluencyAttempt(String(draft.ai_generated_text), duration_seconds, errors)
  if (!attempt) {
    return NextResponse.json({ error: 'Check the reading time and the number of misread or skipped words' }, { status: 400 })
  }

  const [entry] = await sql`
    UPDATE entries_finnish_reading
    SET fluency_attempts = fluency_attempts || ${JSON.stringify([attempt])}::jsonb
    WHERE id = ${id} AND user_id = ${userId} AND date = ${date} AND done = false
      AND jsonb_array_length(fluency_attempts) = ${attempt_number - 1}
    RETURNING *
  `
  if (!entry) {
    return NextResponse.json({ error: 'This attempt was already saved or the practice session expired' }, { status: 409 })
  }
  return NextResponse.json({ entry })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, date, practice_minutes } = await req.json()
  if (!Number.isInteger(id) || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!Number.isInteger(practice_minutes) || practice_minutes < 15 || practice_minutes > 120) {
    return NextResponse.json({ error: 'Record at least 15 minutes of reading before finishing' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`
    SELECT points_per_entry FROM track_settings
    WHERE track = 'finnish_reading' AND child_user_id = ${userId}
  `
  const points = settings?.points_per_entry ?? 10
  const [entry] = await sql`
    UPDATE entries_finnish_reading
    SET done = true, points_awarded = ${points}, practice_minutes = ${practice_minutes}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND date = ${date} AND done = false
      AND jsonb_array_length(fluency_attempts) = ${REQUIRED_FLUENCY_ATTEMPTS}
    RETURNING *
  `

  if (!entry) {
    return NextResponse.json({ error: 'Complete all three reading attempts before saving' }, { status: 409 })
  }
  return NextResponse.json({ entry, points_awarded: points })
}
