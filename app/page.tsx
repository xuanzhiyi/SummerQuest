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
  }
  const [child] = await sql`SELECT name, perfect_day_threshold FROM users WHERE id = ${userId}`
  if (session.user.role === 'guardian' && child) viewingName = String(child.name)
  const perfectThreshold = child?.perfect_day_threshold != null ? Number(child.perfect_day_threshold) : null

  const tiles = await getCalendarTiles(userId)

  return (
    <div className="hud-page">
      <div className="hud-shell">
        <CalendarGrid tiles={tiles} role={session.user.role} name={viewingName} perfectThreshold={perfectThreshold} />
      </div>
    </div>
  )
}
