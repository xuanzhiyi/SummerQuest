'use client'

import { useState } from 'react'
import type { TrackProgress } from '@/lib/progress'

const TRACK_LABELS: Record<string, string> = {
  sport:                '🏃 Sport / 运动',
  math:                 '🔢 Math / 数学',
  books:                '📚 Books / 读书',
  english:              '✍️ English / 英文写作',
  finnish:              '🇫🇮 Finnish / 芬兰语',
  chinese:              '🀄 Chinese / 中文阅读',
  swedish:              '🇸🇪 Swedish / 瑞典语',
  french:               '🇫🇷 French / 法语',
  science:              '🔬 Science / 科学',
  ai_project:           '🤖 AI Project / AI项目',
  piano:                '🎹 Piano / 钢琴',
  word_english_finnish: '🇫🇮 Finnish words / 芬兰单词',
  word_english_chinese: '🀄 Chinese words / 中文单词',
  word_english_swedish: '🇸🇪 Swedish words / 瑞典单词',
  word_english_french:  '🇫🇷 French words / 法语单词',
}

interface Props {
  progress: TrackProgress[]
  role: string
}

export default function ProgressView({ progress, role }: Props) {
  return (
    <div className="space-y-3">
      {progress.map((tp) => (
        <TrackCard key={tp.track} tp={tp} role={role} />
      ))}
    </div>
  )
}

function TrackCard({ tp, role }: { tp: TrackProgress; role: string }) {
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [redeemError, setRedeemError] = useState('')

  // Find the next unlocked-but-unrequested threshold
  const availableReward = tp.thresholds.find(
    (t) => t.unlocked && !t.requested_at && !t.fulfilled_at && !t.dismissed_at
  )

  async function requestRedeem(thresholdId: number) {
    setRedeemError('')
    setRedeeming(thresholdId)
    const res = await fetch('/api/rewards/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold_id: thresholdId }),
    })
    const data = await res.json()
    setRedeeming(null)
    if (!res.ok) { setRedeemError(data.error ?? 'Something went wrong'); return }
    // Reload page to show updated state
    window.location.reload()
  }

  // Progress bar toward next threshold
  const nextThreshold = tp.thresholds
    .filter((t) => !t.fulfilled_at)
    .sort((a, b) => a.points_required - b.points_required)
    .find((t) => t.points_required > tp.total_points)

  const barMax = nextThreshold?.points_required ?? Math.max(tp.total_points, 100)
  const barPct = Math.min(100, (tp.total_points / barMax) * 100)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold">{TRACK_LABELS[tp.track]}</span>
        <div className="flex items-center gap-2 text-sm">
          {tp.current_streak > 0 && (
            <span className="text-orange-500 font-medium">🔥 {tp.current_streak}d</span>
          )}
          <span className="font-bold text-amber-600">{tp.total_points} pts</span>
        </div>
      </div>

      {/* Progress bar */}
      {barMax > 0 && (
        <div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${barPct}%` }}
            />
          </div>
          {nextThreshold && (
            <p className="text-xs text-gray-400 mt-1">
              {tp.total_points} / {nextThreshold.points_required} pts → {nextThreshold.reward_description}
            </p>
          )}
        </div>
      )}

      {/* Unlocked reward — request redemption */}
      {availableReward && role === 'child' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">🎉 Reward unlocked!</p>
          <p className="text-sm text-amber-700 mb-2">{availableReward.reward_description}</p>
          <button
            onClick={() => requestRedeem(availableReward.id)}
            disabled={redeeming === availableReward.id}
            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors"
          >
            {redeeming === availableReward.id ? 'Sending…' : 'I want to redeem this! 🎁'}
          </button>
          {redeemError && <p className="text-red-500 text-xs mt-1">{redeemError}</p>}
        </div>
      )}

      {/* Viewer/admin: just show unlocked badge, not the button */}
      {availableReward && role !== 'child' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-800">🎉 Reward available</p>
          <p className="text-sm text-amber-700">{availableReward.reward_description}</p>
        </div>
      )}

      {/* Pending / fulfilled thresholds */}
      {tp.thresholds.filter((t) => t.requested_at || t.fulfilled_at).map((t) => (
        <div key={t.id} className="text-xs text-gray-500 flex items-center gap-1">
          {t.fulfilled_at ? (
            <span className="text-green-600 font-medium">✓ Redeemed:</span>
          ) : (
            <span className="text-amber-600 font-medium">⏳ Pending:</span>
          )}
          {t.reward_description}
        </div>
      ))}
    </div>
  )
}
