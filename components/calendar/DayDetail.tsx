'use client'

import { useState } from 'react'
import Link from 'next/link'

import SportForm from '@/components/tracks/SportForm'
import BooksForm from '@/components/tracks/BooksForm'
import WritingForm from '@/components/tracks/WritingForm'
import ReadingForm from '@/components/tracks/ReadingForm'
import ProblemSetForm from '@/components/tracks/ProblemSetForm'
import AiProjectForm from '@/components/tracks/AiProjectForm'

interface Props {
  date: string
  entries: Record<string, unknown[]>
  canEdit: boolean
  showScores: boolean
  role: string
}

const TRACK_LABELS: Record<string, string> = {
  sport:      '🏃 Sport',
  math:       '🔢 Math',
  books:      '📚 Books',
  english:    '✍️ English writing',
  finnish:    '🇫🇮 Finnish writing',
  chinese:    '🀄 Chinese reading',
  swedish:    '🇸🇪 Swedish reading',
  french:     '🇫🇷 French reading',
  science:    '🔬 Science',
  ai_project: '🤖 AI Project',
}

const DAILY_TRACKS = ['sport', 'math', 'chinese', 'swedish', 'french', 'books']
const OCCASIONAL_TRACKS = ['english', 'finnish', 'science', 'ai_project']

export default function DayDetail({ date, entries, canEdit, showScores, role }: Props) {
  const [liveEntries, setLiveEntries] = useState(entries)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function handleSaved(track: string, entry: unknown, _points: number) {
    setLiveEntries((prev) => ({
      ...prev,
      [track]: [...(prev[track] ?? []), entry],
    }))
    setActiveTrack(null)
  }

  const totalEntries = Object.values(liveEntries).flat().length

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

      {totalEntries === 0 && !canEdit && (
        <p className="text-gray-400 text-sm text-center py-12">Nothing logged this day.</p>
      )}

      <section className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Daily activities
        </h3>
        <div className="space-y-2">
          {DAILY_TRACKS.map((track) => (
            <TrackCard
              key={track}
              track={track}
              date={date}
              entries={liveEntries[track] ?? []}
              canEdit={canEdit}
              showScores={showScores}
              isOpen={activeTrack === track}
              onToggle={() => setActiveTrack(activeTrack === track ? null : track)}
              onSaved={(entry, pts) => handleSaved(track, entry, pts)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Optional / occasional
        </h3>
        <div className="space-y-2">
          {OCCASIONAL_TRACKS.map((track) => (
            <TrackCard
              key={track}
              track={track}
              date={date}
              entries={liveEntries[track] ?? []}
              canEdit={canEdit}
              showScores={showScores}
              isOpen={activeTrack === track}
              onToggle={() => setActiveTrack(activeTrack === track ? null : track)}
              onSaved={(entry, pts) => handleSaved(track, entry, pts)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function TrackCard({
  track, date, entries, canEdit, showScores, isOpen, onToggle, onSaved,
}: {
  track: string
  date: string
  entries: unknown[]
  canEdit: boolean
  showScores: boolean
  isOpen: boolean
  onToggle: () => void
  onSaved: (entry: unknown, pts: number) => void
}) {
  const hasEntries = entries.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
      >
        <span className="font-medium text-sm">{TRACK_LABELS[track]}</span>
        <div className="flex items-center gap-2">
          {hasEntries && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ✓ logged
            </span>
          )}
          {canEdit && !hasEntries && (
            <span className="text-xs text-amber-500">+ add</span>
          )}
          <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {hasEntries ? (
            <EntryView track={track} entries={entries} showScores={showScores} />
          ) : canEdit ? (
            <TrackEntryForm track={track} date={date} onSaved={onSaved} />
          ) : (
            <p className="text-sm text-gray-400 pt-3">Nothing logged.</p>
          )}
        </div>
      )}
    </div>
  )
}

function TrackEntryForm({
  track, date, onSaved,
}: {
  track: string
  date: string
  onSaved: (entry: unknown, pts: number) => void
}) {
  switch (track) {
    case 'sport':
      return <SportForm date={date} onSaved={onSaved} />
    case 'books':
      return <BooksForm date={date} onSaved={onSaved} />
    case 'english':
      return <WritingForm date={date} track="english" onSaved={onSaved} />
    case 'finnish':
      return <WritingForm date={date} track="finnish" onSaved={onSaved} />
    case 'chinese':
      return <ReadingForm date={date} track="chinese" onSaved={onSaved} />
    case 'swedish':
      return <ReadingForm date={date} track="swedish" onSaved={onSaved} />
    case 'french':
      return <ReadingForm date={date} track="french" onSaved={onSaved} />
    case 'math':
      return <ProblemSetForm date={date} track="math" onSaved={onSaved} />
    case 'science':
      return <ProblemSetForm date={date} track="science" onSaved={onSaved} />
    case 'ai_project':
      return <AiProjectForm date={date} onSaved={onSaved} />
    default:
      return null
  }
}

function EntryView({
  track, entries, showScores,
}: {
  track: string
  entries: unknown[]
  showScores: boolean
}) {
  return (
    <div className="pt-3 space-y-4">
      {entries.map((entry, i) => {
        const e = entry as Record<string, unknown>
        return <EntryCard key={i} track={track} entry={e} showScores={showScores} />
      })}
    </div>
  )
}

function EntryCard({
  track, entry, showScores,
}: {
  track: string
  entry: Record<string, unknown>
  showScores: boolean
}) {
  const HIDDEN = new Set(['id', 'user_id', 'created_at', 'updated_at', 'date', 'image_key'])

  switch (track) {
    case 'sport':
      return (
        <div className="text-sm space-y-0.5">
          <p className="font-medium">{String(entry.activity)}</p>
          <p className="text-gray-500">{String(entry.duration_minutes)} minutes</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    case 'books':
      return (
        <div className="text-sm space-y-2">
          <p className="font-medium">{String(entry.title)}</p>
          <p className="text-gray-700">{String(entry.notes)}</p>
          {!!entry.ai_question && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">AI question 💭</p>
              <p className="text-gray-700">{String(entry.ai_question)}</p>
              {!!entry.ai_answer && (
                <div className="mt-2 pt-2 border-t border-amber-100">
                  <p className="text-xs text-amber-600 font-medium mb-0.5">Answer:</p>
                  <p className="text-gray-700">{String(entry.ai_answer)}</p>
                </div>
              )}
            </div>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    case 'english':
    case 'finnish':
      return (
        <div className="text-sm space-y-2">
          {!!entry.prompt_used && (
            <p className="text-xs text-gray-400 italic">{String(entry.prompt_used)}</p>
          )}
          <p className="text-gray-700 leading-relaxed">{String(entry.paragraph)}</p>
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
              <p className="text-gray-700 whitespace-pre-wrap">{String(entry.ai_feedback)}</p>
              {showScores && entry.ai_score != null && (
                <p className="text-xs text-gray-400 mt-2">
                  Score (admin): {String(entry.ai_score)}/100
                </p>
              )}
            </div>
          )}
          {!entry.ai_feedback && (
            <p className="text-xs text-amber-500">Feedback pending…</p>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    case 'chinese':
    case 'swedish':
    case 'french':
      return (
        <div className="text-sm space-y-2">
          <div className="bg-blue-50 rounded-lg p-3 leading-relaxed font-medium text-gray-800 whitespace-pre-wrap">
            {String(entry.ai_generated_text)}
          </div>
          <p className="text-xs text-gray-400">Level {String(entry.level_at_time)}/10 · Read ✓</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    case 'math':
    case 'science':
      return (
        <div className="text-sm space-y-2">
          <div className="bg-gray-50 rounded-lg p-3 whitespace-pre-wrap text-gray-800">
            {String(entry.ai_problems)}
          </div>
          {!!entry.child_answers && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Answers:</p>
              <p className="text-gray-700 whitespace-pre-wrap">{String(entry.child_answers)}</p>
            </div>
          )}
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
              <p className="text-gray-700 whitespace-pre-wrap">{String(entry.ai_feedback)}</p>
              {showScores && entry.ai_score != null && (
                <p className="text-xs text-gray-400 mt-2">
                  Score (admin): {String(entry.ai_score)}/100
                </p>
              )}
            </div>
          )}
          {!entry.ai_feedback && (
            <p className="text-xs text-amber-500">Feedback pending…</p>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    case 'ai_project':
      return (
        <div className="text-sm space-y-2">
          {!!entry.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(entry.image_url)}
              alt="AI project screenshot"
              className="rounded-lg max-h-60 w-full object-contain bg-gray-50"
            />
          )}
          <p className="text-gray-700">{String(entry.caption)}</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )

    default:
      return (
        <div className="text-sm space-y-1">
          {Object.entries(entry)
            .filter(([k]) => !HIDDEN.has(k))
            .map(([k, v]) => (
              <div key={k}>
                <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}: </span>
                <span>{String(v ?? '')}</span>
              </div>
            ))}
        </div>
      )
  }
}

function PointsBadge({ points }: { points: number }) {
  if (!points) return null
  return (
    <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
      +{points} pts
    </span>
  )
}
