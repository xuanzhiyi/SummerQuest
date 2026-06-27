'use client'

import { useState } from 'react'

const AI_MODELS = [
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (fast, cheap)' },
  { value: 'gemini-3.1-flash-preview',      label: 'Gemini 3.1 Flash (balanced)' },
  { value: 'gemini-3.1-pro-preview',        label: 'Gemini 3.1 Pro (most capable)' },
]

interface Props {
  settings: Record<string, string>
}

export default function SystemSettingsForm({ settings }: Props) {
  const [aiModel, setAiModel] = useState(settings.ai_model ?? 'gemini-3.1-flash-lite-preview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/admin/system-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ai_model', value: aiModel }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          AI Model
        </p>
        <select
          value={aiModel}
          onChange={e => setAiModel(e.target.value)}
          style={{ width: '100%', border: '2px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: '#111827' }}
        >
          {AI_MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
          Used for all AI-generated content (reading texts, math problems, feedback).
        </p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: '100%', background: saved ? '#10B981' : '#F59E0B', color: '#fff',
          borderRadius: 16, padding: '16px', border: 'none',
          fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
