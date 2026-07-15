'use client'

import { useState } from 'react'
import { ENGLISH_WRITING_PROMPTS, FINNISH_WRITING_PROMPTS } from '@/lib/ai/prompts'
import { MIN_WRITING_CHARACTERS, writingCharacterCount } from '@/lib/writing-validation'

interface Props {
  date: string
  track: 'english' | 'finnish'
  onSaved: (entry: unknown, points: number) => void
}

function randomPrompt(prompts: string[], current?: string) {
  if (prompts.length <= 1) return prompts[0] ?? ''
  let next = prompts[Math.floor(Math.random() * prompts.length)]
  while (next === current) {
    next = prompts[Math.floor(Math.random() * prompts.length)]
  }
  return next
}

export default function WritingForm({ date, track, onSaved }: Props) {
  const prompts = track === 'english' ? ENGLISH_WRITING_PROMPTS : FINNISH_WRITING_PROMPTS
  const [selectedPrompt, setSelectedPrompt] = useState(randomPrompt(prompts))
  const [paragraph, setParagraph] = useState('')
  const [result, setResult] = useState<{ feedback: string; ai_score?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const characterCount = writingCharacterCount(paragraph)
  const hasMinimumLength = characterCount >= MIN_WRITING_CHARACTERS

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch(`/api/entries/${track}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, paragraph, prompt_used: selectedPrompt }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }

    if (data.entry.ai_feedback) {
      setResult({ feedback: data.entry.ai_feedback, ai_score: data.entry.ai_score })
    } else {
      // AI failed — still saved, just no feedback
      onSaved(data.entry, data.points_awarded)
    }
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

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-500">Writing prompt</label>
          <button
            type="button"
            onClick={() => {
              setSelectedPrompt(randomPrompt(prompts, selectedPrompt))
            }}
            className="text-xs text-amber-500 hover:text-amber-700"
          >
            🔀 Different prompt
          </button>
        </div>
        <div className="bg-amber-50 rounded-lg px-3 py-2 text-sm text-gray-700">
          {selectedPrompt}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-500">Your writing</label>
          <span className={`text-xs ${hasMinimumLength ? 'text-green-600' : 'text-gray-400'}`}>
            {characterCount}/{MIN_WRITING_CHARACTERS} characters
          </span>
        </div>
        <textarea
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
          placeholder="Start writing…"
          rows={6}
          className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading || !hasMinimumLength}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {loading ? 'Submitting… (AI grading 🤔)' : 'Submit writing ✓'}
      </button>
    </form>
  )
}
