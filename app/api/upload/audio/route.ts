import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadAudio, deleteObject } from '@/lib/storage'

// POST /api/upload/audio?track=chinese&date=2026-06-27
// Body: raw audio blob (Content-Type: audio/webm etc.)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const track = req.nextUrl.searchParams.get('track')
  const date = req.nextUrl.searchParams.get('date')
  if (!track || !date) {
    return NextResponse.json({ error: 'Missing track or date' }, { status: 400 })
  }

  const contentType = req.headers.get('content-type') ?? 'audio/webm'
  const arrayBuffer = await req.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.length === 0) {
    return NextResponse.json({ error: 'Empty audio' }, { status: 400 })
  }

  try {
    const key = await uploadAudio(buffer, contentType, track, parseInt(session.user.id), date)
    return NextResponse.json({ key })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// DELETE /api/upload/audio?key=reading/chinese/2/...webm
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === 'viewer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = req.nextUrl.searchParams.get('key')
  if (!key || (!key.startsWith('reading/') && !key.startsWith('piano/'))) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Enforce ownership: key must contain the user's own id segment
  const userId = session.user.id
  const keyParts = key.split('/')  // ['reading', 'chinese', '2', 'filename']
  if (keyParts[2] !== userId && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await deleteObject(key)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
