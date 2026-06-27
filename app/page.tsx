import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCalendarTiles } from '@/lib/calendar'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import sql from '@/lib/db'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Guardian views their first linked child's data
  let userId = parseInt(session.user.id)
  let viewingName = session.user.name ?? ''
  if (session.user.role === 'guardian') {
    const childId = session.user.childIds?.[0]
    if (!childId) redirect('/login')
    userId = childId
    const [child] = await sql`SELECT name FROM users WHERE id = ${childId}`
    if (child) viewingName = String(child.name)
  }
  const tiles = await getCalendarTiles(userId)

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ background: '#FFFBF5' }}>
      <CalendarGrid tiles={tiles} role={session.user.role} name={viewingName} />
    </div>
  )
}
