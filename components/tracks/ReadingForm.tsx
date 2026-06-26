'use client'

import { useState, useEffect } from 'react'

interface Props {
  date: string
  track: 'chinese' | 'swedish' | 'french'
  onSaved: (entry: unknown, points: number) => void
}

const TRACK_LABEL: Record<string, string> = {
  chinese: 'Chinese 🀄',
  swedish: 'Swedish 🇸🇪',
  french: 'French 🇫🇷',
}

export default function ReadingForm({ date, track, onSaved }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [level, setLevel] = useState<number>(5)
  const [loadingText, setLoadingText] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/entries/${track}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.text) { setText(d.text); setLevel(d.level) }
        else setError(d.error ?? 'Could not load reading text')
      })
      .catch(() => setError('Could not load reading text'))
      .finally(() => setLoadingText(false))
  }, [track])

  async function handleDone() {
    if (!text) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/entries/${track}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, ai_generated_text: text, level_at_time: level }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    onSaved(data.entry, data.points_awarded)
  }

  if (loadingText) {
    return (
      <div className="pt-3 text-sm text-gray-400 animate-pulse">
        Loading {TRACK_LABEL[track]} reading text…
      </div>
    )
  }

  if (error) {
    return <p className="pt-3 text-sm text-red-500">{error}</p>
  }

  return (
    <div className="pt-3 space-y-3">
      <div className="bg-blue-50 rounded-lg p-4 text-base leading-relaxed whitespace-pre-wrap font-medium text-gray-800">
        {text}
      </div>
      <p className="text-xs text-gray-400">
        Read through the passage, then tap Done when you&apos;re finished.
      </p>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        onClick={handleDone}
        disabled={saving}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {saving ? 'Saving…' : 'Done — I read it ✓'}
      </button>
    </div>
  )
}
