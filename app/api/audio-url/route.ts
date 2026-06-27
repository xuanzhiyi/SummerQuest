import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getImageUrl } from '@/lib/storage'

// GET /api/audio-url?key=reading/chinese/2/2026-06-27-xxx.webm
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  if (!key || !key.startsWith('reading/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  try {
    const url = await getImageUrl(key)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Could not get URL' }, { status: 500 })
  }
}
