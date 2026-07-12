'use client'

import { useRef, useState, useCallback } from 'react'
import WordPairCard, { type CardState } from './WordPairCard'
import PairConnectionLayer from './PairConnectionLayer'
import type { WordPair, LanguagePair } from '@/lib/wordlists'
import { getRandomWords, PAIR_LABELS } from '@/lib/wordlists'

interface Connection { leftId: string; rightId: string }

interface Props {
  initialWords: WordPair[]
  languagePair: LanguagePair
  date: string
  level?: number
  onSaved: (score: number, points: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WordPairingGame({ initialWords, languagePair, date, level = 5, onSaved }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const [round, setRound] = useState(0)
  const [words, setWords] = useState<WordPair[]>(initialWords)
  const [shuffledRight, setShuffledRight] = useState(() => shuffle(initialWords))
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [phase, setPhase] = useState<'connecting' | 'submitted'>('connecting')
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({})
  const [wrongAnswers, setWrongAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const wordById = useCallback((id: string) => words.find((w) => w.wordId === id), [words])

  const labels = PAIR_LABELS[languagePair]

  function handleLeftPress(id: string) {
    if (phase === 'submitted') return
    setSelectedLeft((prev) => (prev === id ? null : id))
  }

  function handleRightPress(id: string) {
    if (phase === 'submitted' || !selectedLeft) return
    setConnections((prev) => {
      const withoutLeft  = prev.filter((c) => c.leftId !== selectedLeft)
      const withoutRight = withoutLeft.filter((c) => c.rightId !== id)
      const alreadyConnected = prev.find((c) => c.leftId === selectedLeft)?.rightId === id
      if (alreadyConnected) return withoutLeft
      return [...withoutRight, { leftId: selectedLeft, rightId: id }]
    })
    setSelectedLeft(null)
  }

  function getLeftState(id: string): CardState {
    if (phase === 'submitted') {
      if (correctMap[id] !== undefined) return correctMap[id] ? 'correct' : 'incorrect'
      return 'idle'
    }
    if (selectedLeft === id) return 'selected'
    if (connections.some((c) => c.leftId === id)) return 'connected'
    return 'idle'
  }

  function getRightState(id: string): CardState {
    if (phase === 'submitted') {
      const conn = connections.find((c) => c.rightId === id)
      if (!conn) return 'idle'
      return correctMap[conn.leftId] ? 'correct' : 'incorrect'
    }
    if (connections.some((c) => c.rightId === id)) return 'connected'
    return 'idle'
  }

  async function handleSubmit() {
    if (connections.length !== words.length || submitting) return
    setSubmitting(true)

    const newCorrectMap: Record<string, boolean> = {}
    const newWrong: Record<string, string> = {}
    connections.forEach((conn) => {
      const correct = conn.leftId === conn.rightId
      newCorrectMap[conn.leftId] = correct
      if (!correct) {
        const word = wordById(conn.leftId)
        if (word) newWrong[conn.leftId] = word.target
      }
    })
    setCorrectMap(newCorrectMap)
    setWrongAnswers(newWrong)
    setPhase('submitted')

    const correctCount = Object.values(newCorrectMap).filter(Boolean).length
    const score = Math.round((correctCount / words.length) * 100)

    try {
      const res = await fetch('/api/entries/word-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          language_pair: languagePair,
          words_shown: words,
          results: connections.map((c) => ({ wordId: c.leftId, selectedWordId: c.rightId })),
        }),
      })
      const data = await res.json()
      setSubmitting(false)
      onSaved(data.score ?? score, data.points_awarded ?? 0)
    } catch {
      setSubmitting(false)
    }
  }

  function handleNextRound() {
    const newWords = getRandomWords(languagePair, 5, level)
    leftRefs.current.clear()
    rightRefs.current.clear()
    setWords(newWords)
    setShuffledRight(shuffle(newWords))
    setSelectedLeft(null)
    setConnections([])
    setCorrectMap({})
    setWrongAnswers({})
    setRound((r) => r + 1)
    setPhase('connecting')
  }

  const allConnected = connections.length === words.length

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 text-center">
        Tap a word on the left, then tap its match on the right to connect them.
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
        <span>English</span>
        <span>{labels.flag} {labels.right}</span>
      </div>

      {/* Game grid */}
      <div ref={containerRef} className="relative grid grid-cols-2 gap-x-4 gap-y-3">
        <PairConnectionLayer
          key={round}
          connections={connections}
          leftRefs={leftRefs.current}
          rightRefs={rightRefs.current}
          containerRef={containerRef}
          correctMap={correctMap}
          submitted={phase === 'submitted'}
        />

        {/* Left column — English */}
        <div className="flex flex-col gap-3 z-10">
          {words.map((w) => (
            <WordPairCard
              key={w.wordId}
              id={w.wordId}
              text={w.english}
              side="left"
              state={getLeftState(w.wordId)}
              onPress={handleLeftPress}
              cardRef={(el) => {
                if (el) leftRefs.current.set(w.wordId, el)
                else leftRefs.current.delete(w.wordId)
              }}
            />
          ))}
        </div>

        {/* Right column — target language */}
        <div className="flex flex-col gap-3 z-10">
          {shuffledRight.map((w) => (
            <WordPairCard
              key={w.wordId}
              id={w.wordId}
              text={w.target}
              hint={w.hint}
              side="right"
              state={getRightState(w.wordId)}
              onPress={handleRightPress}
              cardRef={(el) => {
                if (el) rightRefs.current.set(w.wordId, el)
                else rightRefs.current.delete(w.wordId)
              }}
            />
          ))}
        </div>
      </div>

      {/* Wrong answer hints */}
      {phase === 'submitted' && Object.keys(wrongAnswers).length > 0 && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="font-semibold text-red-700 mb-2 text-sm">Correct answers:</p>
          <div className="space-y-1">
            {Object.entries(wrongAnswers).map(([leftId, correctTarget]) => {
              const word = wordById(leftId)
              if (!word) return null
              return (
                <div key={leftId} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{word.english}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-700 font-medium">{correctTarget}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {phase === 'connecting' ? (
          <button
            onClick={handleSubmit}
            disabled={!allConnected || submitting}
            className="px-8 py-3 text-base font-bold bg-amber-400 hover:bg-amber-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Saving...' : 'Check answers'}
          </button>
        ) : (
          <button
            onClick={handleNextRound}
            className="px-8 py-3 text-base font-bold bg-amber-400 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-sm"
          >
            Next round →
          </button>
        )}
      </div>
    </div>
  )
}
