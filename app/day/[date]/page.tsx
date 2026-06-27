import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isToday, isPast, PROGRAM_START, PROGRAM_END } from '@/lib/calendar'
import sql from '@/lib/db'
import DayDetail from '@/components/calendar/DayDetail'

interface Props {
  params: Promise<{ date: string }>
}

export default async function DayPage({ params }: Props) {
  const { date } = await params
  const session = await auth()
  if (!session) redirect('/login')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()
  if (date < PROGRAM_START || date > PROGRAM_END) notFound()

  const role = session.user.role
  if (role === 'child' && date > new Date().toISOString().slice(0, 10)) {
    redirect('/')
  }

  // Guardian views their first linked child's data
  let userId = parseInt(session.user.id)
  if (role === 'guardian') {
    const childId = session.user.childIds?.[0]
    if (!childId) redirect('/')
    userId = childId
  }
  const canEdit = role === 'admin' || (role === 'child' && isToday(date))

  const [books, english, finnish, chinese, swedish, french, math, science, aiProject, sport, piano, diary, wordPairing, wordTargets, trackSettings] =
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
      sql`SELECT * FROM entries_piano      WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT * FROM entries_diary      WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT language_pair, points_awarded FROM entries_word_pairing WHERE user_id = ${userId} AND date = ${date}`,
      sql`SELECT track, daily_target FROM track_settings WHERE track LIKE 'word_%'`,
      sql`SELECT track, points_per_entry FROM track_settings`,
    ])

  // Group word pairing by language pair
  const wpByPair: Record<string, unknown[]> = {}
  for (const row of wordPairing) {
    const r = row as Record<string, unknown>
    const key = `word_${r.language_pair as string}`
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
    piano: piano as unknown[],
    diary: diary as unknown[],
    ...wpByPair,
  }

  // Compute earned XP by summing points_awarded from all entries
  function sumPoints(rows: unknown[]) {
    return rows.reduce((acc: number, r: unknown) => acc + (Number((r as Record<string, unknown>).points_awarded) || 0), 0)
  }
  const earnedXP =
    sumPoints(books) + sumPoints(english) + sumPoints(finnish) + sumPoints(chinese) +
    sumPoints(swedish) + sumPoints(french) + sumPoints(math) + sumPoints(science) +
    sumPoints(aiProject) + sumPoints(sport) + sumPoints(piano) + sumPoints(diary) + sumPoints(wordPairing)

  const dailyTargets: Record<string, number> = {}
  for (const row of wordTargets) {
    const r = row as Record<string, unknown>
    dailyTargets[r.track as string] = r.daily_target as number
  }

  const xpPerTrack: Record<string, number> = {}
  for (const row of trackSettings) {
    const r = row as Record<string, unknown>
    xpPerTrack[r.track as string] = Number(r.points_per_entry) || 10
  }

  return (
    <div className="max-w-lg mx-auto">
      <DayDetail
        date={date}
        entries={entries}
        canEdit={canEdit}
        showScores={role === 'admin'}
        role={role}
        dailyTargets={dailyTargets}
        earnedXP={earnedXP}
        xpPerTrack={xpPerTrack}
        name={session.user.name ?? ''}
      />
    </div>
  )
}
