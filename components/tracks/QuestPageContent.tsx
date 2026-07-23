'use client'

import { useState, useEffect } from 'react'
import SportForm from './SportForm'
import PianoForm from './PianoForm'
import BooksForm from './BooksForm'
import WritingForm from './WritingForm'
import ReadingForm from './ReadingForm'
import ProblemSetForm from './ProblemSetForm'
import AiProjectForm from './AiProjectForm'
import DiaryForm from './DiaryForm'
import WordPairingGame from '@/components/game/WordPairingGame'
import { getRandomWords, PAIR_LABELS } from '@/lib/wordlists'
import type { LanguagePair } from '@/lib/wordlists'
import MathText from '@/components/ui/MathText'
import RubyText from '@/components/ui/RubyText'

interface Props {
  track: string
  date: string
  initialEntries: Record<string, unknown>[]
  canEdit: boolean
  showScores: boolean
  level?: number
}

export default function QuestPageContent({ track, date, initialEntries, canEdit, showScores, level = 5 }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [lastResult, setLastResult] = useState<{ score: number; points: number } | null>(null)
  const [reRecording, setReRecording] = useState(false)

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
          initialWords={getRandomWords(languagePair, 5, level)}
          languagePair={languagePair}
          date={date}
          level={level}
          onSaved={handleWordPairingSaved}
        />
      </div>
    )
  }

  // Reading tracks: show audio player + re-record option instead of generic "already logged"
  const isReadingTrack = track === 'chinese' || track === 'swedish' || track === 'french' || track === 'english-reading' || track === 'finnish-reading'
  if (hasEntry && isReadingTrack) {
    const latestEntry = entries[entries.length - 1]
    if (reRecording) {
      return (
        <ReadingForm
          date={date}
          track={track as 'chinese' | 'swedish' | 'french' | 'english-reading' | 'finnish-reading'}
          onSaved={handleSaved}
          initialText={latestEntry.ai_generated_text as string}
          initialLevel={latestEntry.level_at_time as number}
          savedAudioKey={(latestEntry.audio_key as string | null) ?? null}
          savedEntryId={(latestEntry.id as number) ?? null}
        />
      )
    }
    return (
      <ReadingEntryCard
        entry={latestEntry}
        canEdit={canEdit}
        onReRecord={() => setReRecording(true)}
        track={track}
      />
    )
  }

  // Piano: pass saved entry so PianoForm can show playback + re-record
  if (hasEntry && track === 'piano') {
    const latestEntry = entries[entries.length - 1]
    return <PianoForm date={date} onSaved={handleSaved} savedEntry={latestEntry} canEdit={canEdit} />
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
    case 'piano':      return <PianoForm date={date} onSaved={onSaved} />
    case 'books':      return <BooksForm date={date} onSaved={onSaved} />
    case 'english':    return <WritingForm date={date} track="english" onSaved={onSaved} />
    case 'finnish':    return <WritingForm date={date} track="finnish" onSaved={onSaved} />
    case 'chinese':          return <ReadingForm date={date} track="chinese" onSaved={onSaved} />
    case 'swedish':          return <ReadingForm date={date} track="swedish" onSaved={onSaved} />
    case 'french':           return <ReadingForm date={date} track="french" onSaved={onSaved} />
    case 'english-reading':  return <ReadingForm date={date} track="english-reading" onSaved={onSaved} />
    case 'finnish-reading':  return <ReadingForm date={date} track="finnish-reading" onSaved={onSaved} />
    case 'math':       return <ProblemSetForm date={date} track="math" onSaved={onSaved} />
    case 'science':    return <ProblemSetForm date={date} track="science" onSaved={onSaved} />
    case 'ai_project': return <AiProjectForm date={date} onSaved={onSaved} />
    case 'diary':      return <DiaryForm date={date} onSaved={onSaved} />
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
    case 'piano':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-1">
          <p className="font-medium">🎹 {String(entry.piece)}</p>
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
    case 'chinese': case 'swedish': case 'french': case 'english-reading': case 'finnish-reading':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <div className="bg-blue-50 rounded-lg p-3 font-medium text-gray-800">
            {track === 'chinese'
              ? <RubyText text={String(entry.ai_generated_text)} />
              : <div className="whitespace-pre-wrap">{String(entry.ai_generated_text)}</div>}
          </div>
          <p className="text-xs text-gray-400">Level {String(entry.level_at_time)}/10 · Read ✓</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'english': case 'finnish':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          {!!entry.prompt_used && (
            <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-gray-600 italic">
              {String(entry.prompt_used)}
            </div>
          )}
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{String(entry.paragraph)}</p>
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
              <p className="text-gray-700 whitespace-pre-wrap">{String(entry.ai_feedback)}</p>
              {showScores && entry.ai_score != null && (
                <p className="text-xs text-gray-400 mt-2">Score: {String(entry.ai_score)}/100</p>
              )}
            </div>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'diary':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{String(entry.language)}</p>
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{String(entry.entry_text)}</p>
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Diary review</p>
              <p className="text-gray-700 whitespace-pre-wrap">{String(entry.ai_feedback)}</p>
            </div>
          )}
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'ai_project':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          {!!entry.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(entry.image_url)} alt="AI project screenshot" className="w-full rounded-lg" />
          )}
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{String(entry.caption)}</p>
          <PointsBadge points={entry.points_awarded as number} />
        </div>
      )
    case 'math': case 'science':
      return (
        <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-2">
          <MathText text={String(entry.ai_problems)} className="bg-gray-50 rounded-lg p-3 text-gray-800" />
          {!!entry.ai_feedback && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
              <MathText text={String(entry.ai_feedback)} className="text-gray-700" />
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

function ReadingEntryCard({
  entry, canEdit, onReRecord, track,
}: { entry: Record<string, unknown>; canEdit: boolean; onReRecord: () => void; track: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loadingAudio, setLoadingAudio] = useState(false)

  const audioKey = entry.audio_key as string | null

  useEffect(() => {
    if (!audioKey) return
    setLoadingAudio(true)
    fetch(`/api/audio-url?key=${encodeURIComponent(audioKey)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setAudioUrl(d.url) })
      .catch(() => {})
      .finally(() => setLoadingAudio(false))
  }, [audioKey])

  return (
    <div className="space-y-3 pt-3">
      {/* Text passage */}
      <div className="bg-blue-50 rounded-xl p-4 text-base font-medium text-gray-800">
        {track === 'chinese'
          ? <RubyText text={String(entry.ai_generated_text)} />
          : <div className="leading-relaxed whitespace-pre-wrap">{String(entry.ai_generated_text)}</div>}
      </div>

      {/* Done banner */}
      <div style={{ background: '#D1FAE5', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#065F46', fontWeight: 800, fontSize: 15, margin: 0 }}>✓ Quest complete!</p>
          <p style={{ color: '#059669', fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>
            Level {String(entry.level_at_time)}/10 · +{String(entry.points_awarded)} pts
          </p>
        </div>
        <span style={{ fontSize: 26 }}>🎉</span>
      </div>

      {/* Audio player */}
      {audioKey && (
        <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
            🎧 Your recording
          </p>
          {loadingAudio && (
            <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>Loading audio…</p>
          )}
          {audioUrl && (
            <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 10 }} />
          )}
          {!loadingAudio && !audioUrl && (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Recording unavailable</p>
          )}
        </div>
      )}

      {!audioKey && (
        <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '14px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, margin: 0 }}>No recording saved for this entry</p>
        </div>
      )}

      {/* Re-record */}
      {canEdit && (
        <button
          onClick={onReRecord}
          style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '2px solid #FECACA', borderRadius: 18, padding: '16px', fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
        >
          🎙️ Record again
        </button>
      )}
    </div>
  )
}
