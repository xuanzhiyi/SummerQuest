import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isToday, PROGRAM_START, PROGRAM_END } from '@/lib/calendar'
import sql from '@/lib/db'
import Link from 'next/link'
import NavBar from '@/components/ui/NavBar'
import QuestPageContent from '@/components/tracks/QuestPageContent'

interface Props {
  params: Promise<{ date: string; track: string }>
}

const TRACK_INFO: Record<string, { title: string; description: string }> = {
  sport:          { title: '🏃 Sport',             description: 'Log your physical activity for today.' },
  math:           { title: '🔢 Math',              description: 'Solve AI-generated math problems.' },
  books:          { title: '📚 Books',             description: 'Log a book you read and answer a question.' },
  english:        { title: '✍️ English writing',   description: 'Write a paragraph in English.' },
  finnish:        { title: '🇫🇮 Finnish writing',   description: 'Write a paragraph in Finnish.' },
  chinese:        { title: '🀄 Chinese reading',   description: 'Read an AI-generated Chinese text.' },
  swedish:        { title: '🇸🇪 Swedish reading',   description: 'Read an AI-generated Swedish text.' },
  french:         { title: '🇫🇷 French reading',    description: 'Read an AI-generated French text.' },
  science:        { title: '🔬 Science',           description: 'Explore a science problem set.' },
  ai_project:     { title: '🤖 AI Project',        description: 'Document your AI project with a screenshot.' },
  word_english_finnish: { title: '🇫🇮 Word pairing — Finnish', description: 'Match English words to their Finnish translations.' },
  word_english_chinese: { title: '🀄 Word pairing — Chinese', description: 'Match English words to their Chinese translations.' },
  word_english_swedish: { title: '🇸🇪 Word pairing — Swedish', description: 'Match English words to their Swedish translations.' },
  word_english_french:  { title: '🇫🇷 Word pairing — French',  description: 'Match English words to their French translations.' },
}

export default async function QuestPage({ params }: Props) {
  const { date, track } = await params
  const session = await auth()
  if (!session) redirect('/login')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()
  if (date < PROGRAM_START || date > PROGRAM_END) notFound()
  if (!TRACK_INFO[track]) notFound()

  const role = session.user.role
  if (role === 'child' && date > new Date().toISOString().slice(0, 10)) redirect('/')

  const canEdit = role === 'admin' || (role === 'child' && isToday(date))
  const userId = parseInt(session.user.id)

  // Load existing entries for this track/date
  let entries: unknown[] = []
  if (track.startsWith('word_')) {
    const languagePair = track.replace('word_', '')
    entries = [...await sql`
      SELECT * FROM entries_word_pairing
      WHERE user_id = ${userId} AND date = ${date} AND language_pair = ${languagePair}
      ORDER BY created_at ASC
    `]
  } else {
    const tableMap: Record<string, string> = {
      sport: 'entries_sport', math: 'entries_math', books: 'entries_books',
      english: 'entries_english', finnish: 'entries_finnish',
      chinese: 'entries_chinese', swedish: 'entries_swedish', french: 'entries_french',
      science: 'entries_science', ai_project: 'entries_ai_project',
    }
    const table = tableMap[track]
    if (table) {
      entries = [...await sql`SELECT * FROM ${sql(table)} WHERE user_id = ${userId} AND date = ${date}`]
    }
  }

  const info = TRACK_INFO[track]
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role={role} name={session.user.name ?? ''} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href={`/day/${date}`} className="text-amber-500 hover:text-amber-700 text-sm shrink-0">
            ← {displayDate}
          </Link>
          <h2 className="text-xl font-bold">{info.title}</h2>
        </div>

        <p className="text-sm text-gray-500 mb-6">{info.description}</p>

        <QuestPageContent
          track={track}
          date={date}
          initialEntries={entries as Record<string, unknown>[]}
          canEdit={canEdit}
          showScores={role === 'admin'}
        />
      </main>
    </div>
  )
}
