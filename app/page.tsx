import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCalendarTiles } from '@/lib/calendar'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import sql from '@/lib/db'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Viewer sees the child's data (read-only)
  let userId = parseInt(session.user.id)
  if (session.user.role === 'viewer') {
    const [child] = await sql`SELECT id FROM users WHERE role = 'child' LIMIT 1`
    if (child) userId = Number(child.id)
  }
  const tiles = await getCalendarTiles(userId)

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ background: '#FFFBF5' }}>
      <CalendarGrid tiles={tiles} role={session.user.role} name={session.user.name ?? ''} />
    </div>
  )
}
