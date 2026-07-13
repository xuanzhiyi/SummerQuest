'use client'

import { useState } from 'react'

interface Props {
  date: string
  onSaved: (entry: unknown, points: number) => void
}

export default function BooksForm({ date, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [entry, setEntry] = useState<Record<string, unknown> | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/entries/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, title, notes }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    setEntry(data.entry)
    if (!data.entry.ai_question) {
      // No AI question generated (AI failed) — done
      onSaved(data.entry, data.points_awarded)
    }
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/entries/books', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry!.id, ai_answer: answer }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    onSaved(data.entry, 0) // points already counted on first save
  }

  if (entry?.ai_question) {
    return (
      <form onSubmit={handleAnswer} className="pt-3 space-y-3">
        <div className="bg-amber-50 rounded-lg p-3 text-sm">
          <p className="text-xs font-medium text-amber-700 mb-1">Quick question 💭</p>
          <p className="text-gray-700">{entry.ai_question as string}</p>
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer…"
          rows={3}
          className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Submit answer ✓'}
          </button>
          <button
            type="button"
            onClick={() => onSaved(entry, 0)}
            className="text-sm text-gray-400 hover:text-gray-600 px-3"
          >
            Skip
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Book title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you reading?"
          className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes — what happened / what did you think?</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write in your own words…"
          rows={4}
          className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {loading ? 'Saving… (AI thinking 🤔)' : 'Log reading ✓'}
      </button>
    </form>
  )
}
