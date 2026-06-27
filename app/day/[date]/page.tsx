import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isToday, isPast, PROGRAM_START, PROGRAM_END } from '@/lib/calendar'
import sql from '@/lib/db'
import NavBar from '@/components/ui/NavBar'
import DayDetail from '@/components/calendar/DayDetail'

interface Props {
  params: Promise<{ date: string }>
}

export default async function DayPage({ params }: Props) {
  const { date } = await params
  const session = await auth()
  if (!session) redirect('/login')

  // Validate date format and range
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()
  if (date < PROGRAM_START || date > PROGRAM_END) notFound()


  // Child can only view today or past
  const role = session.user.role
  if (role === 'child' && date > new Date().toISOString().slice(0, 10)) {
    redirect('/')
  }

  const userId = parseInt(session.user.id)
  const canEdit = role === 'admin' || (role === 'child' && isToday(date))

  // Load all entries for this day
  const [books, english, finnish, chinese, swedish, french, math, science, aiProject, sport, wordPairing, wordTargets] =
    await Promise.all([
      sql`SELECT * FROM entries_books      WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_english    WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_finnish    WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_chinese    WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_swedish    WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_french     WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_math       WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_science    WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_ai_project WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_sport      WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT language_pair FROM entries_word_pairing WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT track, daily_target FROM track_settings WHERE track LIKE 'word_%'`,
    ])

  // Group word pairing by language pair
  const wpByPair: Record<string, unknown[]> = {}
  for (const row of wordPairing) {
    const lp = (row as Record<string, unknown>).language_pair as string
    const key = `word_${lp}`
    wpByPair[key] = [...(wpByPair[key] ?? []), row]
  }

  const entries = {
    books: books as unknown[],
    english: english as unknown[],
    finnish: finnish as unknown[],
    chinese: chinese as unknown[],
    swedish: swedish as unknown[],
    french: french as unknown[],
    math: math as unknown[],
    science: science as unknown[],
    ai_project: aiProject as unknown[],
    sport: sport as unknown[],
    ...wpByPair,
  }

  // Build daily_target map for word pairing tracks
  const dailyTargets: Record<string, number> = {}
  for (const row of wordTargets) {
    const r = row as Record<string, unknown>
    dailyTargets[r.track as string] = r.daily_target as number
  }

  // Admin sees numeric AI scores; child/viewer do not
  const showScores = role === 'admin'

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role={role} name={session.user.name ?? ''} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <DayDetail
          date={date}
          entries={entries}
          canEdit={canEdit}
          showScores={showScores}
          role={role}
          dailyTargets={dailyTargets}
        />
      </main>
    </div>
  )
}
