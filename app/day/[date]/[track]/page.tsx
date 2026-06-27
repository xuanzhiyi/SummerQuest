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
  piano:          { title: '🎹 Piano / 钢琴',             description: 'Log your piano practice. / 记录今天的钢琴练习' },
  sport:          { title: '🏃 Sport / 运动',              description: 'Log your physical activity for today. / 记录今天的运动' },
  math:           { title: '🔢 Math / 数学',               description: 'Solve AI-generated math problems. / 完成数学题' },
  books:          { title: '📚 Books / 读书',              description: 'Log a book you read and answer a question. / 记录读书内容' },
  english:        { title: '✍️ English / 英文写作',         description: 'Write a paragraph in English. / 用英语写一段话' },
  finnish:        { title: '🇫🇮 Finnish / 芬兰语写作',      description: 'Write a paragraph in Finnish. / 用芬兰语写一段话' },
  chinese:        { title: '🀄 Chinese / 中文阅读',         description: 'Read an AI-generated Chinese text. / 阅读中文文章' },
  swedish:        { title: '🇸🇪 Swedish / 瑞典语',          description: 'Read an AI-generated Swedish text. / 阅读瑞典语文章' },
  french:         { title: '🇫🇷 French / 法语',             description: 'Read an AI-generated French text. / 阅读法语文章' },
  science:        { title: '🔬 Science / 科学',            description: 'Explore a science problem set. / 探索科学题' },
  ai_project:     { title: '🤖 AI Project / AI项目',       description: 'Document your AI project. / 记录AI项目' },
  word_english_finnish: { title: '🇫🇮 Finnish words / 芬兰单词', description: 'Match English–Finnish word pairs. / 配对英语和芬兰语单词' },
  word_english_chinese: { title: '🀄 Chinese words / 中文单词', description: 'Match English–Chinese word pairs. / 配对英语和中文单词' },
  word_english_swedish: { title: '🇸🇪 Swedish words / 瑞典单词', description: 'Match English–Swedish word pairs. / 配对英语和瑞典语单词' },
  word_english_french:  { title: '🇫🇷 French words / 法语单词',  description: 'Match English–French word pairs. / 配对英语和法语单词' },
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

  // Viewer sees the child's data (read-only)
  let userId = parseInt(session.user.id)
  if (role === 'viewer') {
    const [child] = await sql`SELECT id FROM users WHERE role = 'child' LIMIT 1`
    if (child) userId = Number(child.id)
  }

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

  const icon = info.title.match(/^\S+/)?.[0] ?? '📋'
  const titleText = info.title.replace(/^\S+\s*/, '')

  return (
    <div className="max-w-lg mx-auto min-h-screen" style={{ background: '#FFFBF5' }}>
      {/* Navy header */}
      <header style={{ background: '#0B1F3A', padding: '50px 20px 26px' }}>
        <NavBar role={role} name={session.user.name ?? ''} />
        <Link
          href={`/day/${date}`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20, textDecoration: 'none', marginBottom: 12 }}
        >
          ←
        </Link>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          QUEST DETAILS
        </p>
        <div className="animate-quest-pop" style={{ fontSize: 58, lineHeight: 1, marginBottom: 8 }}>
          {icon}
        </div>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 30, fontWeight: 600, color: '#fff', margin: 0 }}>
          {titleText}
        </h1>
      </header>

      <main style={{ padding: '18px 16px 32px' }}>
        {/* Description card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 14px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>
            DESCRIPTION
          </p>
          <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
            {info.description}
          </p>
        </div>

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
