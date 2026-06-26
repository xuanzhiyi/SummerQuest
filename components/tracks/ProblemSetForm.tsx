'use client'

import { useState, useEffect } from 'react'

interface Props {
  date: string
  track: 'math' | 'science'
  onSaved: (entry: unknown, points: number) => void
}

export default function ProblemSetForm({ date, track, onSaved }: Props) {
  const [problems, setProblems] = useState<string | null>(null)
  const [answers, setAnswers] = useState('')
  const [result, setResult] = useState<{ feedback: string } | null>(null)
  const [loadingProblems, setLoadingProblems] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/entries/${track}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.problems) setProblems(d.problems)
        else setError(d.error ?? 'Could not load problems')
      })
      .catch(() => setError('Could not load problems'))
      .finally(() => setLoadingProblems(false))
  }, [track])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch(`/api/entries/${track}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, ai_problems: problems, child_answers: answers }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }

    if (data.entry.ai_feedback) {
      setResult({ feedback: data.entry.ai_feedback })
    } else {
      onSaved(data.entry, data.points_awarded)
    }
  }

  if (loadingProblems) {
    return (
      <div className="pt-3 text-sm text-gray-400 animate-pulse">
        Generating {track} problems…
      </div>
    )
  }

  if (result) {
    return (
      <div className="pt-3 space-y-3">
        <div className="bg-green-50 rounded-lg p-3 text-sm">
          <p className="text-xs font-semibold text-green-700 mb-1">Feedback ✨</p>
          <p className="text-gray-700 whitespace-pre-wrap">{result.feedback}</p>
        </div>
        <button
          onClick={() => onSaved({}, 0)}
          className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
        >
          Done ✓
        </button>
      </div>
    )
  }

  if (error) return <p className="pt-3 text-sm text-red-500">{error}</p>

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
        {problems}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Your answers (write them out — e.g. "1. 42  2. ...")
        </label>
        <textarea
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          placeholder="1. …&#10;2. …&#10;3. …"
          rows={5}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {submitting ? 'Submitting… (AI checking 🤔)' : 'Submit answers ✓'}
      </button>
    </form>
  )
}
