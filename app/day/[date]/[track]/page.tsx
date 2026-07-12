import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isToday, PROGRAM_START, PROGRAM_END, todayDate } from '@/lib/calendar'
import sql from '@/lib/db'
import Link from 'next/link'
import NavBar from '@/components/ui/NavBar'
import QuestPageContent from '@/components/tracks/QuestPageContent'

interface Props {
  params: Promise<{ date: string; track: string }>
}

const TRACK_INFO: Record<string, { title: string; description: string; code: string }> = {
  piano: { title: 'Piano', description: 'Log your piano practice for today.', code: 'PN' },
  sport: { title: 'Sport', description: 'Log your physical activity for today.', code: 'RUN' },
  math: { title: 'Math', description: 'Solve AI-generated math problems.', code: '123' },
  books: { title: 'Books', description: 'Log a book you read and answer a question.', code: 'BK' },
  english: { title: 'English', description: 'Write a paragraph in English.', code: 'EN' },
  finnish: { title: 'Finnish', description: 'Write a paragraph in Finnish.', code: 'FI' },
  chinese: { title: 'Chinese', description: 'Read an AI-generated Chinese text.', code: 'ZH' },
  swedish: { title: 'Swedish', description: 'Read an AI-generated Swedish text.', code: 'SE' },
  french: { title: 'French', description: 'Read an AI-generated French text.', code: 'FR' },
  'english-reading': { title: 'English Reading', description: 'Read an AI-generated English passage aloud.', code: 'EN-R' },
  'finnish-reading': { title: 'Finnish Reading', description: 'Read an AI-generated Finnish passage aloud.', code: 'FI-R' },
  science: { title: 'Science', description: 'Explore a science problem set.', code: 'SCI' },
  ai_project: { title: 'AI Project', description: 'Document your AI project.', code: 'AI' },
  word_english_finnish: { title: 'Finnish Words', description: 'Match English-Finnish word pairs.', code: 'FI-W' },
  word_english_chinese: { title: 'Chinese Words', description: 'Match English-Chinese word pairs.', code: 'ZH-W' },
  word_english_swedish: { title: 'Swedish Words', description: 'Match English-Swedish word pairs.', code: 'SE-W' },
  word_english_french: { title: 'French Words', description: 'Match English-French word pairs.', code: 'FR-W' },
  diary: { title: 'Diary', description: 'Write a diary entry in any language.', code: 'DY' },
}

export default async function QuestPage({ params }: Props) {
  const { date, track } = await params
  const session = await auth()
  if (!session) redirect('/login')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()
  if (date < PROGRAM_START || date > PROGRAM_END) notFound()
  if (!TRACK_INFO[track]) notFound()

  const role = session.user.role
  if (role === 'child' && date > todayDate()) redirect('/')

  const canEdit = role === 'admin' || (role === 'child' && isToday(date))

  let userId = parseInt(session.user.id)
  if (role === 'guardian') {
    const childId = session.user.childIds?.[0]
    if (!childId) redirect('/')
    userId = childId
  }

  let trackLevel = 5
  if (track.startsWith('word_')) {
    const [ts] = await sql`SELECT current_level FROM track_settings WHERE track = ${track} AND child_user_id = ${userId}`
    if (ts?.current_level) trackLevel = ts.current_level
  }

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
      'english-reading': 'entries_english_reading', 'finnish-reading': 'entries_finnish_reading',
      science: 'entries_science', ai_project: 'entries_ai_project', diary: 'entries_diary',
      piano: 'entries_piano',
    }
    const table = tableMap[track]
    if (table) {
      entries = [...await sql`SELECT * FROM ${sql(table)} WHERE user_id = ${userId} AND date = ${date}`]
    }
  }

  const info = TRACK_INFO[track]

  return (
    <div className="hud-page">
      <div className="hud-shell">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={role} name={session.user.name ?? ''} />
          <Link
            href={`/day/${date}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#12182A', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', marginBottom: 18 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5470', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 12px' }}>
            Quest Details
          </p>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(79,209,255,0.13)', border: '1px solid rgba(79,209,255,0.27)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, color: '#4FD1FF' }}>
              {info.code}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
            {info.title}
          </h1>
        </header>

        <main style={{ padding: '0 16px 40px' }}>
          <div className="hud-card" style={{ borderRadius: 20, padding: 18, marginBottom: 20, boxShadow: 'none' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5470', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>
              Description
            </p>
            <p style={{ fontSize: 15, color: '#C7CEE0', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
              {info.description}
            </p>
          </div>

          <div className="hud-surface" style={{ borderRadius: 20, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7793', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 14px', textAlign: 'center' }}>
              Log Today&apos;s Progress
            </p>
            <QuestPageContent
              track={track}
              date={date}
              initialEntries={entries as Record<string, unknown>[]}
              canEdit={canEdit}
              showScores={role === 'admin'}
              level={trackLevel}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
