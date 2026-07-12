'use client'

import { useState } from 'react'
import type { TrackProgress } from '@/lib/progress'
import { TRACK_LABELS } from '@/lib/tracks'

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
    window.location.reload()
  }

  const nextThreshold = tp.thresholds
    .filter((t) => !t.fulfilled_at)
    .sort((a, b) => a.points_required - b.points_required)
    .find((t) => t.points_required > tp.total_points)

  const barMax = nextThreshold?.points_required ?? Math.max(tp.total_points, 100)
  const barPct = Math.min(100, (tp.total_points / barMax) * 100)

  return (
    <div className="hud-surface" style={{ borderRadius: 18, padding: 16 }}>
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontWeight: 700, color: '#EDEFF5' }}>{TRACK_LABELS[tp.track] ?? tp.track}</span>
        <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
          {tp.current_streak > 0 && <span style={{ color: '#FFB648', fontWeight: 700 }}>{tp.current_streak}d</span>}
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#4FD1FF' }}>{tp.total_points} XP</span>
        </div>
      </div>

      {barMax > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 10, background: '#1A2136', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div
              style={{
                height: '100%',
                width: `${barPct}%`,
                background: 'linear-gradient(90deg, #4FD1FF, #A6E9FF)',
                borderRadius: 999,
                boxShadow: '0 0 12px #4FD1FF',
                transition: 'width 0.25s',
              }}
            />
          </div>
          {nextThreshold && (
            <p style={{ fontSize: 12, color: '#6B7793', fontWeight: 700, margin: '8px 0 0' }}>
              {tp.total_points} / {nextThreshold.points_required} XP - {nextThreshold.reward_description}
            </p>
          )}
        </div>
      )}

      {availableReward && (
        <div style={{ marginTop: 12, background: 'rgba(255,182,72,0.10)', border: '1px solid rgba(255,182,72,0.24)', borderRadius: 14, padding: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FFB648', margin: '0 0 4px' }}>Reward available</p>
          <p style={{ fontSize: 13, color: '#C7CEE0', margin: role === 'child' ? '0 0 10px' : 0 }}>{availableReward.reward_description}</p>
          {role === 'child' && (
            <button
              onClick={() => requestRedeem(availableReward.id)}
              disabled={redeeming === availableReward.id}
              style={{ background: 'linear-gradient(90deg, #4FD1FF, #A6E9FF)', color: '#0A0E17', border: 'none', borderRadius: 12, padding: '10px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: redeeming === availableReward.id ? 0.6 : 1 }}
            >
              {redeeming === availableReward.id ? 'Sending...' : 'Redeem'}
            </button>
          )}
          {redeemError && <p style={{ color: '#FF5C7A', fontSize: 12, margin: '8px 0 0' }}>{redeemError}</p>}
        </div>
      )}

      {tp.thresholds.filter((t) => t.requested_at || t.fulfilled_at).map((t) => (
        <div key={t.id} style={{ fontSize: 12, color: '#6B7793', marginTop: 8 }}>
          <span style={{ color: t.fulfilled_at ? '#A3E635' : '#FFB648', fontWeight: 700 }}>
            {t.fulfilled_at ? 'Redeemed:' : 'Pending:'}
          </span>{' '}
          {t.reward_description}
        </div>
      ))}
    </div>
  )
}
