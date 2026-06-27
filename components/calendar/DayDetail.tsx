'use client'

import Link from 'next/link'

interface Props {
  date: string
  entries: Record<string, unknown[]>
  canEdit: boolean
  showScores: boolean
  role: string
  dailyTargets?: Record<string, number>
}

const DAILY_QUESTS = [
  { track: 'sport',               title: '🏃 Sport',               bg: 'bg-orange-50 border-orange-200' },
  { track: 'math',                title: '🔢 Math',                bg: 'bg-blue-50 border-blue-200' },
  { track: 'books',               title: '📚 Books',               bg: 'bg-yellow-50 border-yellow-200' },
  { track: 'chinese',             title: '🀄 Chinese reading',     bg: 'bg-red-50 border-red-200' },
  { track: 'swedish',             title: '🇸🇪 Swedish reading',     bg: 'bg-sky-50 border-sky-200' },
  { track: 'french',              title: '🇫🇷 French reading',      bg: 'bg-indigo-50 border-indigo-200' },
  { track: 'word_english_finnish',title: '🇫🇮 Finnish words',       bg: 'bg-teal-50 border-teal-200' },
  { track: 'word_english_chinese',title: '🀄 Chinese words',       bg: 'bg-rose-50 border-rose-200' },
  { track: 'word_english_swedish',title: '🇸🇪 Swedish words',       bg: 'bg-cyan-50 border-cyan-200' },
  { track: 'word_english_french', title: '🇫🇷 French words',        bg: 'bg-violet-50 border-violet-200' },
]

const OCCASIONAL_QUESTS = [
  { track: 'english',    title: '✍️ English writing', bg: 'bg-emerald-50 border-emerald-200' },
  { track: 'finnish',    title: '🇫🇮 Finnish writing', bg: 'bg-lime-50 border-lime-200' },
  { track: 'science',    title: '🔬 Science',          bg: 'bg-purple-50 border-purple-200' },
  { track: 'ai_project', title: '🤖 AI Project',       bg: 'bg-pink-50 border-pink-200' },
]

function entryCount(track: string, entries: Record<string, unknown[]>): number {
  return (entries[track] ?? []).length
}

function isDone(track: string, entries: Record<string, unknown[]>, dailyTargets?: Record<string, number>): boolean {
  const count = entryCount(track, entries)
  if (count === 0) return false
  const target = dailyTargets?.[track] ?? 1
  return count >= target
}

function progressLabel(track: string, entries: Record<string, unknown[]>, dailyTargets?: Record<string, number>): string | null {
  if (!track.startsWith('word_')) return null
  const count = entryCount(track, entries)
  const target = dailyTargets?.[track] ?? 1
  if (count === 0) return null
  return `${count}/${target} sets`
}

export default function DayDetail({ date, entries, canEdit, role, dailyTargets }: Props) {
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/" className="text-amber-500 hover:text-amber-700 text-sm shrink-0">
          ← Calendar
        </Link>
        <h2 className="text-xl font-bold">{displayDate}</h2>
        {canEdit && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
            Today — log your activities
          </span>
        )}
      </div>

      <section className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Daily activities
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {DAILY_QUESTS.map(({ track, title, bg }) => {
            const done = isDone(track, entries, dailyTargets)
            const progress = progressLabel(track, entries, dailyTargets)
            return (
              <Link
                key={track}
                href={`/day/${date}/${track}`}
                className={`
                  relative flex flex-col gap-1.5 p-4 min-h-[96px] rounded-xl border-2 transition-all
                  hover:shadow-md active:scale-95
                  ${bg}
                  ${done ? 'opacity-90' : ''}
                `}
              >
                <span className="font-semibold text-sm text-gray-900 leading-tight">{title}</span>
                {done ? (
                  <span className="text-xs text-green-600 font-medium">✓ Done{progress ? ` (${progress})` : ''}</span>
                ) : progress ? (
                  <span className="text-xs text-amber-600 font-medium">{progress} — keep going!</span>
                ) : canEdit ? (
                  <span className="text-xs text-amber-500 font-medium">Tap to log →</span>
                ) : (
                  <span className="text-xs text-gray-400">Not logged</span>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Optional / occasional
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {OCCASIONAL_QUESTS.map(({ track, title, bg }) => {
            const done = isDone(track, entries, dailyTargets)
            return (
              <Link
                key={track}
                href={`/day/${date}/${track}`}
                className={`
                  relative flex flex-col gap-1.5 p-4 min-h-[96px] rounded-xl border-2 transition-all
                  hover:shadow-md active:scale-95
                  ${bg}
                  ${done ? 'opacity-90' : ''}
                `}
              >
                <span className="font-semibold text-sm text-gray-900 leading-tight">{title}</span>
                {done ? (
                  <span className="text-xs text-green-600 font-medium">✓ Done</span>
                ) : canEdit ? (
                  <span className="text-xs text-amber-500 font-medium">Tap to log →</span>
                ) : (
                  <span className="text-xs text-gray-400">Not logged</span>
                )}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
