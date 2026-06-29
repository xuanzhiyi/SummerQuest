'use client'

import { useState } from 'react'

const TRACK_LABELS: Record<string, string> = {
  sport:                '🏃 Sport',
  math:                 '🔢 Math',
  books:                '📚 Books',
  english:              '✍️ English',
  finnish:              '🇫🇮 Finnish',
  chinese:              '🀄 Chinese',
  swedish:              '🇸🇪 Swedish',
  french:               '🇫🇷 French',
  science:              '🔬 Science',
  ai_project:           '🤖 AI Project',
  piano:                '🎹 Piano',
  word_english_finnish: '🇫🇮 Finnish words',
  word_english_chinese: '🀄 Chinese words',
  word_english_swedish: '🇸🇪 Swedish words',
  word_english_french:  '🇫🇷 French words',
  diary:                '📓 Diary',
}

const AI_GRADED = new Set(['english', 'finnish', 'math', 'science'])
const HAS_LEVEL = new Set([
  'english', 'finnish', 'chinese', 'swedish', 'french', 'math', 'science',
  'word_english_finnish', 'word_english_chinese', 'word_english_swedish', 'word_english_french',
])
const HAS_DAILY_TARGET = new Set([
  'word_english_finnish', 'word_english_chinese', 'word_english_swedish', 'word_english_french',
])
const HAS_POINT_CAP = new Set([
  'word_english_finnish', 'word_english_chinese', 'word_english_swedish', 'word_english_french',
])

interface TrackSetting {
  track: string
  current_level: number
  effort_weight: number
  points_per_entry: number
  daily_target: number
  daily_point_cap: number | null
}

interface Threshold {
  id: number
  track: string
  points_required: number
  reward_description: string
  requested_at: string | null
  fulfilled_at: string | null
}

interface Props {
  settings: Record<string, unknown>[]
  thresholds: Record<string, unknown>[]
  childUserId?: number
}

export default function SettingsForm({ settings, thresholds, childUserId }: Props) {
  const [rows, setRows] = useState<TrackSetting[]>(settings as unknown as TrackSetting[])
  const [tRows, setTRows] = useState<Threshold[]>(thresholds as unknown as Threshold[])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [newThreshold, setNewThreshold] = useState<{ track: string; pts: string; desc: string }>({
    track: 'sport', pts: '', desc: '',
  })
  const [addingThreshold, setAddingThreshold] = useState(false)

  async function saveSetting(track: string, field: string, value: number) {
    setSaving(track + field)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track, child_user_id: childUserId, [field]: value }),
    })
    setSaving(null)
    if (res.ok) {
      setSaved(track + field)
      setTimeout(() => setSaved(null), 1500)
    }
  }

  function updateRow(track: string, field: keyof Omit<TrackSetting, 'track' | 'daily_point_cap'> | 'daily_point_cap', value: number) {
    setRows((prev) =>
      prev.map((r) => (r.track === track ? { ...r, [field]: value } : r))
    )
  }

  async function addThreshold() {
    if (!newThreshold.pts || !newThreshold.desc) return
    setAddingThreshold(true)
    const res = await fetch('/api/settings/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track: newThreshold.track,
        points_required: parseInt(newThreshold.pts),
        reward_description: newThreshold.desc,
      }),
    })
    const data = await res.json()
    setAddingThreshold(false)
    if (res.ok) {
      setTRows((prev) => [...prev, data.threshold])
      setNewThreshold({ track: 'sport', pts: '', desc: '' })
    }
  }

  async function deleteThreshold(id: number) {
    const res = await fetch('/api/settings/thresholds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setTRows((prev) => prev.filter((t) => t.id !== id))
    else {
      const d = await res.json()
      alert(d.error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Track settings */}
      <section>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Track settings
        </h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.track} className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-medium mb-3 text-gray-900">{TRACK_LABELS[row.track] ?? row.track}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {HAS_LEVEL.has(row.track) && (
                  <SettingField
                    label="Level (1–10)"
                    value={row.current_level}
                    min={1} max={10}
                    onChange={(v) => updateRow(row.track, 'current_level', v)}
                    onBlur={(v) => saveSetting(row.track, 'current_level', v)}
                    saving={saving === row.track + 'current_level'}
                    saved={saved === row.track + 'current_level'}
                  />
                )}
                {HAS_DAILY_TARGET.has(row.track) && (
                  <SettingField
                    label="Sets per day"
                    value={row.daily_target}
                    min={1} max={10}
                    onChange={(v) => updateRow(row.track, 'daily_target', v)}
                    onBlur={(v) => saveSetting(row.track, 'daily_target', v)}
                    saving={saving === row.track + 'daily_target'}
                    saved={saved === row.track + 'daily_target'}
                  />
                )}
                {HAS_POINT_CAP.has(row.track) && (
                  <SettingField
                    label="Daily point cap"
                    value={row.daily_point_cap ?? 30}
                    min={1} max={500}
                    onChange={(v) => updateRow(row.track, 'daily_point_cap', v)}
                    onBlur={(v) => saveSetting(row.track, 'daily_point_cap', v)}
                    saving={saving === row.track + 'daily_point_cap'}
                    saved={saved === row.track + 'daily_point_cap'}
                  />
                )}
                {AI_GRADED.has(row.track) && (
                  <SettingField
                    label="Effort weight"
                    value={row.effort_weight}
                    min={0.1} max={5} step={0.1}
                    onChange={(v) => updateRow(row.track, 'effort_weight', v)}
                    onBlur={(v) => saveSetting(row.track, 'effort_weight', v)}
                    saving={saving === row.track + 'effort_weight'}
                    saved={saved === row.track + 'effort_weight'}
                  />
                )}
                <SettingField
                  label="Points/entry"
                  value={row.points_per_entry}
                  min={1} max={100}
                  onChange={(v) => updateRow(row.track, 'points_per_entry', v)}
                  onBlur={(v) => saveSetting(row.track, 'points_per_entry', v)}
                  saving={saving === row.track + 'points_per_entry'}
                  saved={saved === row.track + 'points_per_entry'}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reward thresholds */}
      <section>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Reward thresholds
        </h3>
        <div className="space-y-2 mb-4">
          {tRows.length === 0 && (
            <p className="text-sm text-gray-400">No rewards set yet.</p>
          )}
          {tRows.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              <span className="text-sm font-medium w-24 shrink-0 text-gray-900">{TRACK_LABELS[t.track] ?? t.track}</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                {t.points_required} pts
              </span>
              <span className="text-sm text-gray-700 flex-1">{t.reward_description}</span>
              {(t.requested_at || t.fulfilled_at) ? (
                <span className="text-xs text-gray-400 shrink-0">
                  {t.fulfilled_at ? '✓ done' : '⏳ pending'}
                </span>
              ) : (
                <button
                  onClick={() => deleteThreshold(t.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new threshold */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium mb-3">Add reward threshold</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
            <select
              value={newThreshold.track}
              onChange={(e) => setNewThreshold((p) => ({ ...p, track: e.target.value }))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 col-span-1"
            >
              {Object.entries(TRACK_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="number"
              value={newThreshold.pts}
              onChange={(e) => setNewThreshold((p) => ({ ...p, pts: e.target.value }))}
              placeholder="Points"
              min={1}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
            <input
              type="text"
              value={newThreshold.desc}
              onChange={(e) => setNewThreshold((p) => ({ ...p, desc: e.target.value }))}
              placeholder="Reward description"
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm col-span-2"
            />
          </div>
          <button
            onClick={addThreshold}
            disabled={addingThreshold || !newThreshold.pts || !newThreshold.desc}
            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors"
          >
            {addingThreshold ? 'Adding…' : '+ Add reward'}
          </button>
        </div>
      </section>
    </div>
  )
}

function SettingField({
  label, value, min, max, step = 1, onChange, onBlur, saving, saved,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  onBlur: (v: number) => void
  saving: boolean
  saved: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onBlur={(e) => onBlur(parseFloat(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        {saving && <span className="text-xs text-amber-400 shrink-0">…</span>}
        {saved && <span className="text-xs text-green-500 shrink-0">✓</span>}
      </div>
    </div>
  )
}
