'use client'

import { useState } from 'react'

const PIECE_SUGGESTIONS = [
  'Scales & arpeggios', 'Bach Minuet', 'Für Elise', 'Moonlight Sonata',
  'Chopin Nocturne', 'Canon in D', 'Free improvisation', 'Sight-reading',
]

interface Props {
  date: string
  onSaved: (entry: unknown, points: number) => void
}

export default function PianoForm({ date, onSaved }: Props) {
  const [piece, setPiece] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/entries/piano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, piece, duration_minutes: parseInt(duration) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    onSaved(data.entry, data.points_awarded)
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Piece / what you practiced</label>
        <input
          type="text"
          value={piece}
          onChange={(e) => setPiece(e.target.value)}
          placeholder="e.g. Für Elise, Scales…"
          list="piece-suggestions"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
          required
        />
        <datalist id="piece-suggestions">
          {PIECE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Duration (minutes)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={1}
          max={480}
          placeholder="30"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {loading ? 'Saving…' : 'Log piano ✓'}
      </button>
    </form>
  )
}
