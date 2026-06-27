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
