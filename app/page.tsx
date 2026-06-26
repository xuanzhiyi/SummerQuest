import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCalendarTiles } from '@/lib/calendar'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import NavBar from '@/components/ui/NavBar'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = parseInt(session.user.id)
  const tiles = await getCalendarTiles(userId)

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role={session.user.role} name={session.user.name ?? ''} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <h2 className="text-xl font-semibold mb-1">Summer Quest 2026</h2>
        <p className="text-sm text-gray-500 mb-6">
          29 June – 12 August · Tap a day to see or log activities
        </p>
        <CalendarGrid tiles={tiles} role={session.user.role} />
      </main>
    </div>
  )
}
