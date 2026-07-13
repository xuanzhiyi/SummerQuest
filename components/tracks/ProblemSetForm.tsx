'use client'

import { useState, useEffect } from 'react'
import MathText from '@/components/ui/MathText'

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
        <div className="bg-green-50 rounded-xl p-4 text-sm">
          <p className="text-xs font-semibold text-green-700 mb-2">✨ Feedback / 反馈</p>
          <MathText text={result.feedback} className="text-gray-700 leading-relaxed" />
        </div>
        <button
          onClick={() => onSaved({}, 0)}
          style={{ width: '100%', background: '#10B981', color: '#fff', borderRadius: 18, padding: '18px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, cursor: 'pointer' }}
        >
          Done ✓
        </button>
      </div>
    )
  }

  if (error) return <p className="pt-3 text-sm text-red-500">{error}</p>

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-4">
      {problems && (
        <MathText
          text={problems}
          className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed"
        />
      )}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Your answers / 你的答案 (e.g. "1. 42&nbsp;&nbsp;2. ...")
        </label>
        <textarea
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          placeholder={"1. …\n2. …\n3. …"}
          rows={5}
          className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-xl px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        style={{ width: '100%', background: submitting ? '#9CA3AF' : '#F59E0B', color: '#fff', borderRadius: 18, padding: '18px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? '🤔 AI is checking…' : 'Submit answers ✓ / 提交答案'}
      </button>
    </form>
  )
}
