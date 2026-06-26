'use client'

import { useState } from 'react'

const TRACK_LABELS: Record<string, string> = {
  sport:      '🏃 Sport',
  math:       '🔢 Math',
  books:      '📚 Books',
  english:    '✍️ English',
  finnish:    '🇫🇮 Finnish',
  chinese:    '🀄 Chinese',
  swedish:    '🇸🇪 Swedish',
  french:     '🇫🇷 French',
  science:    '🔬 Science',
  ai_project: '🤖 AI Project',
}

interface Threshold {
  id: number
  track: string
  points_required: number
  reward_description: string
  requested_at: string | null
  fulfilled_at: string | null
  dismissed_at: string | null
}

interface Props {
  pending: Record<string, unknown>[]
  recent: Record<string, unknown>[]
}

export default function RewardsQueue({ pending, recent }: Props) {
  const [items, setItems] = useState<Threshold[]>(pending as unknown as Threshold[])
  const [acting, setActing] = useState<number | null>(null)
  const [recentItems, setRecentItems] = useState<Threshold[]>(recent as unknown as Threshold[])

  async function act(id: number, action: 'fulfil' | 'dismiss') {
    setActing(id)
    const res = await fetch('/api/rewards/fulfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold_id: id, action }),
    })
    const data = await res.json()
    setActing(null)
    if (res.ok) {
      setItems((prev) => prev.filter((t) => t.id !== id))
      setRecentItems((prev) => [data.threshold, ...prev].slice(0, 20))
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending queue */}
      <section>
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
            No pending requests 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                      {TRACK_LABELS[t.track]}
                    </span>
                    <p className="font-semibold mt-0.5">{t.reward_description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.points_required} pts threshold ·{' '}
                      Requested {new Date(t.requested_at!).toLocaleDateString('en', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(t.id, 'fulfil')}
                    disabled={acting === t.id}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors"
                  >
                    {acting === t.id ? '…' : '✓ Mark fulfilled'}
                  </button>
                  <button
                    onClick={() => act(t.id, 'dismiss')}
                    disabled={acting === t.id}
                    className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent history */}
      {recentItems.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recent history
          </h3>
          <div className="space-y-2">
            {recentItems.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
                <span className="text-sm">{TRACK_LABELS[t.track]}</span>
                <span className="text-sm text-gray-700 flex-1">{t.reward_description}</span>
                <span className={`text-xs font-medium shrink-0 ${t.fulfilled_at ? 'text-green-600' : 'text-gray-400'}`}>
                  {t.fulfilled_at ? '✓ Fulfilled' : 'Dismissed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
