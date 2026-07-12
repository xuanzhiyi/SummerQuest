'use client'

import { useState } from 'react'
import { QUEST_DEFINITIONS, TRACK_LABELS, getQuestBySettingsTrack } from '@/lib/tracks'

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
  perfectDayThreshold?: number | null
}

export default function SettingsForm({ settings, thresholds, childUserId, perfectDayThreshold }: Props) {
  const [rows, setRows] = useState<TrackSetting[]>(settings as unknown as TrackSetting[])
  const [tRows, setTRows] = useState<Threshold[]>(thresholds as unknown as Threshold[])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [newThreshold, setNewThreshold] = useState({ track: 'sport', pts: '', desc: '' })
  const [addingThreshold, setAddingThreshold] = useState(false)
  const [perfectGoal, setPerfectGoal] = useState<number>(perfectDayThreshold ?? rows.length)
  const [savingGoal, setSavingGoal] = useState(false)
  const [savedGoal, setSavedGoal] = useState(false)

  async function savePerfectGoal(value: number) {
    setSavingGoal(true)
    const res = await fetch('/api/settings/perfect-day', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ child_user_id: childUserId, perfect_day_threshold: value }),
    })
    setSavingGoal(false)
    if (res.ok) {
      setSavedGoal(true)
      setTimeout(() => setSavedGoal(false), 1500)
    }
  }

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

  function updateRow(track: string, field: keyof TrackSetting, value: number) {
    setRows((prev) => prev.map((row) => (row.track === track ? { ...row, [field]: value } : row)))
  }

  async function addThreshold() {
    if (!newThreshold.pts || !newThreshold.desc) return
    setAddingThreshold(true)
    const res = await fetch('/api/settings/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track: newThreshold.track,
        points_required: parseInt(newThreshold.pts, 10),
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
    if (res.ok) setTRows((prev) => prev.filter((threshold) => threshold.id !== id))
    else alert((await res.json()).error)
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Perfect day goal</h3>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-3">
            How many quests finished in one day counts as a perfect day? ({rows.length} quests available)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={perfectGoal}
              min={1}
              max={rows.length}
              onChange={(e) => setPerfectGoal(parseInt(e.target.value, 10) || 1)}
              onBlur={(e) => savePerfectGoal(parseInt(e.target.value, 10) || 1)}
              className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <span className="text-sm text-gray-500">quests</span>
            {savingGoal && <span className="text-xs text-amber-400">Saving</span>}
            {savedGoal && <span className="text-xs text-green-500">Saved</span>}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Track settings</h3>
        <div className="space-y-3">
          {rows.map((row) => {
            const quest = getQuestBySettingsTrack(row.track)
            return (
              <div key={row.track} className="bg-white rounded-xl shadow-sm p-4">
                <p className="font-medium mb-3 text-gray-900">{TRACK_LABELS[row.track] ?? row.track}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {quest?.hasLevel && (
                    <SettingField
                      label="Level (1-10)"
                      value={row.current_level}
                      min={1}
                      max={10}
                      onChange={(value) => updateRow(row.track, 'current_level', value)}
                      onBlur={(value) => saveSetting(row.track, 'current_level', value)}
                      saving={saving === row.track + 'current_level'}
                      saved={saved === row.track + 'current_level'}
                    />
                  )}
                  {quest?.hasDailyTarget && (
                    <SettingField
                      label="Sets per day"
                      value={row.daily_target}
                      min={1}
                      max={10}
                      onChange={(value) => updateRow(row.track, 'daily_target', value)}
                      onBlur={(value) => saveSetting(row.track, 'daily_target', value)}
                      saving={saving === row.track + 'daily_target'}
                      saved={saved === row.track + 'daily_target'}
                    />
                  )}
                  {quest?.hasPointCap && (
                    <SettingField
                      label="Daily point cap"
                      value={row.daily_point_cap ?? 30}
                      min={1}
                      max={500}
                      onChange={(value) => updateRow(row.track, 'daily_point_cap', value)}
                      onBlur={(value) => saveSetting(row.track, 'daily_point_cap', value)}
                      saving={saving === row.track + 'daily_point_cap'}
                      saved={saved === row.track + 'daily_point_cap'}
                    />
                  )}
                  {quest?.aiGraded && (
                    <SettingField
                      label="Effort weight"
                      value={row.effort_weight}
                      min={0.1}
                      max={5}
                      step={0.1}
                      onChange={(value) => updateRow(row.track, 'effort_weight', value)}
                      onBlur={(value) => saveSetting(row.track, 'effort_weight', value)}
                      saving={saving === row.track + 'effort_weight'}
                      saved={saved === row.track + 'effort_weight'}
                    />
                  )}
                  <SettingField
                    label="Points/entry"
                    value={row.points_per_entry}
                    min={1}
                    max={100}
                    onChange={(value) => updateRow(row.track, 'points_per_entry', value)}
                    onBlur={(value) => saveSetting(row.track, 'points_per_entry', value)}
                    saving={saving === row.track + 'points_per_entry'}
                    saved={saved === row.track + 'points_per_entry'}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Reward thresholds</h3>
        <div className="space-y-2 mb-4">
          {tRows.length === 0 && <p className="text-sm text-gray-400">No rewards set yet.</p>}
          {tRows.map((threshold) => (
            <div key={threshold.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              <span className="text-sm font-medium w-24 shrink-0 text-gray-900">{TRACK_LABELS[threshold.track] ?? threshold.track}</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                {threshold.points_required} pts
              </span>
              <span className="text-sm text-gray-700 flex-1">{threshold.reward_description}</span>
              {threshold.requested_at || threshold.fulfilled_at ? (
                <span className="text-xs text-gray-400 shrink-0">{threshold.fulfilled_at ? 'done' : 'pending'}</span>
              ) : (
                <button onClick={() => deleteThreshold(threshold.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium mb-3">Add reward threshold</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
            <select
              value={newThreshold.track}
              onChange={(e) => setNewThreshold((prev) => ({ ...prev, track: e.target.value }))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 col-span-1"
            >
              {QUEST_DEFINITIONS.map((quest) => (
                <option key={quest.settingsTrack} value={quest.settingsTrack}>{quest.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={newThreshold.pts}
              onChange={(e) => setNewThreshold((prev) => ({ ...prev, pts: e.target.value }))}
              placeholder="Points"
              min={1}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
            <input
              type="text"
              value={newThreshold.desc}
              onChange={(e) => setNewThreshold((prev) => ({ ...prev, desc: e.target.value }))}
              placeholder="Reward description"
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm col-span-2"
            />
          </div>
          <button
            onClick={addThreshold}
            disabled={addingThreshold || !newThreshold.pts || !newThreshold.desc}
            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors"
          >
            {addingThreshold ? 'Adding...' : '+ Add reward'}
          </button>
        </div>
      </section>
    </div>
  )
}

function SettingField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onBlur,
  saving,
  saved,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  onBlur: (value: number) => void
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
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onBlur={(e) => onBlur(parseFloat(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        {saving && <span className="text-xs text-amber-400 shrink-0">Saving</span>}
        {saved && <span className="text-xs text-green-500 shrink-0">Saved</span>}
      </div>
    </div>
  )
}
