'use client'

import { useState } from 'react'
import SportForm from './SportForm'
import BooksForm from './BooksForm'
import WritingForm from './WritingForm'
import ReadingForm from './ReadingForm'
import ProblemSetForm from './ProblemSetForm'
import AiProjectForm from './AiProjectForm'
import WordPairingGame from '@/components/game/WordPairingGame'
import { getRandomWords, PAIR_LABELS } from '@/lib/wordlists'
import type { LanguagePair } from '@/lib/wordlists'

interface Props {
  track: string
  date: string
  initialEntries: Record<string, unknown>[]
  canEdit: boolean
  showScores: boolean
}

export default function QuestPageContent({ track, date, initialEntries, canEdit, showScores }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [lastResult, setLastResult] = useState<{ score: number; points: number } | null>(null)

  function handleSaved(entry: unknown, points: number) {
    setEntries((prev) => [...prev, entry as Record<string, unknown>])
  }

  function handleWordPairingSaved(score: number, points: number) {
    setLastResult({ score, points })
    setEntries((prev) => [...prev, { score, points_awarded: points } as Record<string, unknown>])
  }

  const hasEntry = entries.length > 0

  // Word pairing quest
  if (track.startsWith('word_')) {
    const languagePair = track.replace('word_', '') as LanguagePair
    const labels = PAIR_LABELS[languagePair]

    return (
      <div className="space-y-6">
        {lastResult && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <p className="font-bold text-lg text-amber-800">
              {lastResult.score === 100 ? '🎉 Perfect!' : lastResult.score >= 60 ? '👍 Good job!' : '🌱 Keep practicing!'}
            </p>
            <p className="text-amber-700 text-sm mt-1">
              {lastResult.score}% correct · +{lastResult.points} points earned
            </p>
          </div>
        )}

        {hasEntry && canEdit && (
          <p className="text-sm text-center text-gray-500">
            Already logged today — play another round for fun (no extra points)!
          </p>
        )}

        <WordPairingGame
          key={entries.length} // remount on each save to reset state
          initialWords={getRandomWords(languagePair, 5)}
          languagePair={languagePair}
          date={date}
          onSaved={handleWordPairingSaved}
        />
      </div>
    )
  }

  // Regular tracks
  if (hasEntry) {
    return (
      <div className="space-y-4">
        <EntryList track={track} entries={entries} showScores={showScores} />
        {canEdit && (
          <p className="text-sm text-center text-gray-400 pt-2">Already logged today.</p>
        )}
      </div>
    )
  }

  if (!canEdit) {
    return <p className="text-sm text-gray-400 text-center py-12">Nothing logged this day.</p>
  }

  return <TrackForm track={track} date={date} onSaved={handleSaved} />
}

function TrackForm({ track, date, onSaved }: { track: string; date: string; onSaved: (e: unknown, pts: number) => void }) {
  switch (track) {
    case 'sport':      return <SportForm date={date} onSaved={onSaved} />
    case 'books':      return <BooksForm date={date} onSaved={onSaved} />
    case 'english':    return <WritingForm date={date} track="english" onSaved={onSaved} />
    case 'finnish':    return <WritingForm date={date} track="finnish" onSaved={onSaved} />
    case 'chinese':    return <ReadingForm date={date} track="chinese" onSaved={onSaved} />
    case 'swedish':    return <ReadingForm date={date} track="swedish" onSaved={onSaved} />
    case 'french':     return <ReadingForm date={date} track="french" onSaved={onSaved} />
    case 'math':       return <ProblemSetForm date={date} track="math" onSaved={onSaved} />
    case 'science':    return <ProblemSetForm date={date} track="science" onSaved={onSaved} />
    case 'ai_project': return <AiProjectForm date={date} onSaved={onSaved} />
    default:           return null
  }
}

function EntryList({ track, entries, showScores }: { track: string; entries: Record<string, unknown>[]; showScores: boolean }) {
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <EntryCard key={i} track={track} entry={entry} showScores={showScores} />
      ))}
    </div>
  )
}

function EntryCard({ track, entry, showScores }: { track: string; entry: Record<string, unknown>; showScores: boolean }) {
  if (track.startsWith('word_')) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-1">
        <p className="font-medium">{entry.score as number}% correct</p>
        <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          +{entry.points_awarded as number} pts
        </span>
      </div>
    )
  }

  switch (track) {
    case 'sport':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-1">
          <p className="font-medium">{String(entry.activity)}</p>
          <p className="text-gray-500">{String(entry.duration_minutes)} minutes</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'books':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <p className="font-medium">{String(entry.title)}</p>
          <p className="text-gray-700">{String(entry.notes)}</p>
          {!!entry.ai_question && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">AI question 💭</p>
              <p>{String(entry.ai_question)}</p>
              {!!entry.ai_answer && <p className="mt-1 text-gray-600">{String(entry.ai_answer)}</p>}
            </div>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'chinese': case 'swedish': case 'french':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <div className="bg-blue-50 rounded-lg p-3 font-medium text-gray-800 whitespace-pre-wrap">
            {String(entry.ai_generated_text)}
          </div>
          <p className="text-xs text-gray-400">Level {String(entry.level_at_time)}/10 · Read ✓</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'math': case 'science':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <div className="bg-gray-50 rounded-lg p-3 whitespace-pre-wrap text-gray-800">
            {String(entry.ai_problems)}
          </div>
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
              <p className="whitespace-pre-wrap">{String(entry.ai_feedback)}</p>
              {showScores && entry.ai_score != null && (
                <p className="text-xs text-gray-400 mt-2">Score: {String(entry.ai_score)}/100</p>
              )}
            </div>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    default:
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm">
          <PointsBadge points={entry.points_awarded as number} />
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
