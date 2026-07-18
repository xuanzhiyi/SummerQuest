import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toLowerCase()
  if (!code) return NextResponse.json({ error: 'Missing family code' }, { status: 400 })

  const [family] = await sql`
    SELECT code, name
    FROM families
    WHERE LOWER(code) = ${code}
  `

  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

  return NextResponse.json({
    family: {
      code: family.code,
      name: family.name,
    },
  })
}
