'use client'

import { useState, useRef } from 'react'

interface Props {
  date: string
  onSaved: (entry: unknown, points: number) => void
}

export default function AiProjectForm({ date, onSaved }: Props) {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('date', date)
    formData.append('caption', caption)
    if (file) formData.append('image', file)

    const res = await fetch('/api/entries/ai-project', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    onSaved(data.entry, data.points_awarded)
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Screenshot (optional)
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-amber-300 transition-colors"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="max-h-40 mx-auto rounded" />
          ) : (
            <p className="text-sm text-gray-400">Tap to upload a screenshot</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          What did you build / try today?
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe what you made or experimented with…"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {loading ? 'Uploading…' : 'Log AI project ✓'}
      </button>
    </form>
  )
}
