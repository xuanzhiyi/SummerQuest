import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { todayDate } from '@/lib/calendar'
import { uploadImage, getImageUrl } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'guardian') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const date = formData.get('date') as string
  const caption = formData.get('caption') as string
  const file = formData.get('image') as File | null

  if (!date || !caption) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  if (session.user.role === 'child' && date !== todayDate()) {
    return NextResponse.json({ error: 'Can only log today' }, { status: 403 })
  }

  const [settings] = await sql`SELECT points_per_entry FROM track_settings WHERE track = 'ai_project' AND child_user_id = ${userId}`
  const points = settings?.points_per_entry ?? 10

  let image_key: string | null = null
  let image_url: string | null = null

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer())
    image_key = await uploadImage(buffer, file.type, file.name)
    image_url = await getImageUrl(image_key)
  }

  const [entry] = await sql`
    INSERT INTO entries_ai_project (user_id, date, caption, image_key, image_url, points_awarded)
    VALUES (${userId}, ${date}, ${caption}, ${image_key}, ${image_url}, ${points})
    RETURNING *
  `

  return NextResponse.json({ entry, points_awarded: points })
}

