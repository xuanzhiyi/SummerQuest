'use client'

import { useState } from 'react'

const LANGUAGES = [
  { value: 'english',  label: '🇬🇧 English' },
  { value: 'finnish',  label: '🇫🇮 Finnish / Suomi' },
  { value: 'chinese',  label: '🀄 Chinese / 中文' },
  { value: 'swedish',  label: '🇸🇪 Swedish / Svenska' },
  { value: 'french',   label: '🇫🇷 French / Français' },
  { value: 'other',    label: '🌍 Other / 其他' },
]

interface Props {
  date: string
  onSaved: (entry: unknown, points: number) => void
}

export default function DiaryForm({ date, onSaved }: Props) {
  const [language, setLanguage] = useState('english')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/entries/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, language, entry_text: text }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    onSaved(data.entry, data.points_awarded)
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Language / 语言
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLanguage(l.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `2px solid ${language === l.value ? '#F59E0B' : '#E5E7EB'}`,
                background: language === l.value ? '#FEF3C7' : '#fff',
                color: language === l.value ? '#92400E' : '#6B7280',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-500">
            Your diary entry / 你的日记
          </label>
          <span className={`text-xs font-semibold ${wordCount >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
            {wordCount} words
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write about your day… / 写写今天发生的事…"
          rows={7}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading || wordCount < 10}
        style={{
          width: '100%',
          background: loading || wordCount < 10 ? '#9CA3AF' : '#F59E0B',
          color: '#fff',
          borderRadius: 18,
          padding: '18px',
          border: 'none',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 16,
          fontWeight: 800,
          cursor: loading || wordCount < 10 ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Saving… ✏️' : 'Save diary entry ✓ / 保存日记'}
      </button>
    </form>
  )
}
