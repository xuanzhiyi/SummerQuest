'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type DayTile, TOTAL_QUESTS } from '@/types'

interface Props {
  tiles: DayTile[]
  role: string
  name: string
}

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKEND_IDX = new Set([5, 6])

const TODAY = new Date().toISOString().slice(0, 10)

function isFuture(date: string) { return date > TODAY }
function isToday(date: string)  { return date === TODAY }

function getDowIndex(date: string) {
  const d = new Date(date + 'T12:00:00').getDay()
  return d === 0 ? 6 : d - 1 // Mon=0 … Sun=6
}

export default function CalendarGrid({ tiles, role, name }: Props) {
  // Determine available months from tiles
  const months = [...new Set(tiles.map(t => t.date.slice(0, 7)))].sort()
  const initialMonth = months.find(m => m === TODAY.slice(0, 7)) ?? months[0] ?? TODAY.slice(0, 7)
  const [activeMonth, setActiveMonth] = useState(initialMonth)

  const monthIdx = months.indexOf(activeMonth)
  const canPrev = monthIdx > 0
  const canNext = monthIdx < months.length - 1

  const monthTiles = tiles.filter(t => t.date.startsWith(activeMonth))

  // Stats across all time (not just this month)
  const pastTiles = tiles.filter(t => !isFuture(t.date))
  const perfectDays = pastTiles.filter(t => t.completed_quests >= TOTAL_QUESTS).length
  const totalXP = pastTiles.reduce((s, t) => s + t.total_points, 0)
  const totalQuestsDone = pastTiles.reduce((s, t) => s + t.completed_quests, 0)

  // Build calendar grid with padding
  const weeks: (DayTile | null)[][] = []
  let week: (DayTile | null)[] = []
  const prefixPad = monthTiles.length > 0 ? getDowIndex(monthTiles[0].date) : 0
  for (let i = 0; i < prefixPad; i++) week.push(null)
  for (const tile of monthTiles) {
    week.push(tile)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const monthLabel = new Date(activeMonth + '-15').toLocaleString('en', { month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Navy Header */}
      <header style={{ background: '#0B1F3A', padding: '50px 20px 18px', position: 'relative' }}>
        {/* Admin/Progress links + sign out */}
        <div className="flex justify-between items-center mb-3" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          <div className="flex gap-3">
            {role === 'admin' && (
              <>
                <Link href="/admin/settings" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>Settings</Link>
                <Link href="/admin/rewards" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>Rewards</Link>
              </>
            )}
            <Link href="/progress" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>Progress</Link>
          </div>
          <SignOutButton name={name} />
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          🌞 SUMMERQUEST
        </p>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => canPrev && setActiveMonth(months[monthIdx - 1])}
            disabled={!canPrev}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 22, cursor: canPrev ? 'pointer' : 'default', opacity: canPrev ? 1 : 0.3 }}
          >
            ‹
          </button>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', minWidth: 200, textAlign: 'center' }}>
            {monthLabel}
          </h2>
          <button
            onClick={() => canNext && setActiveMonth(months[monthIdx + 1])}
            disabled={!canNext}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 22, cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0.3 }}
          >
            ›
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 10, margin: '16px 14px 0' }}>
        <StatCard flex={1} bg="#D1FAE5" label="Perfect" labelColor="#065F46" value={String(perfectDays)} valueColor="#065F46" />
        <StatCard flex={1.4} bg="#FEF3C7" label="XP Earned" labelColor="#92400E" value={String(totalXP)} valueColor="#F59E0B" />
        <StatCard flex={1} bg="#EFF6FF" label="Quests" labelColor="#1D4ED8" value={String(totalQuestsDone)} valueColor="#1D4ED8" />
      </div>

      {/* Calendar */}
      <div style={{ padding: '16px 14px 24px' }}>
        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DAY_HEADERS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: WEEKEND_IDX.has(i) ? '#C2410C' : '#9CA3AF' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {wk.map((tile, ci) =>
                tile
                  ? <DayCell key={tile.date} tile={tile} />
                  : <div key={`e-${wi}-${ci}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, padding: '0 14px 24px' }}>
        <LegendItem color="#D1FAE5" textColor="#065F46" label="All done / 全部完成" />
        <LegendItem color="#FDE68A" textColor="#92400E" label="Partial / 部分完成" />
        <LegendItem color="#F3F4F6" textColor="#9CA3AF" label="No quests / 未开始" />
        <LegendItem color="transparent" textColor="#D1D5DB" label="Future / 未来" />
      </div>
    </div>
  )
}

function DayCell({ tile }: { tile: DayTile }) {
  const today = isToday(tile.date)
  const future = isFuture(tile.date)
  const dayNum = parseInt(tile.date.slice(8, 10))
  const done = tile.completed_quests
  const allDone = done >= TOTAL_QUESTS
  const partial = done > 0 && !allDone

  let bg = '#F3F4F6'
  let color = '#9CA3AF'
  let boxShadow = 'none'

  if (future) {
    bg = 'transparent'
    color = '#D1D5DB'
  } else if (today) {
    bg = '#FEF3C7'
    color = '#92400E'
    boxShadow = '0 0 0 3px #F59E0B'
  } else if (allDone) {
    bg = '#D1FAE5'
    color = '#065F46'
  } else if (partial) {
    bg = '#FDE68A'
    color = '#92400E'
  }

  const inner = (
    <div style={{
      aspectRatio: '1', borderRadius: '50%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: bg, color, boxShadow,
      cursor: future ? 'default' : 'pointer',
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{dayNum}</span>
      {done > 0 && !future && (
        <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, marginTop: 1, opacity: 0.85 }}>
          {done}/{TOTAL_QUESTS}
        </span>
      )}
    </div>
  )

  if (future) return inner
  return <Link href={`/day/${tile.date}`} style={{ textDecoration: 'none' }}>{inner}</Link>
}

function StatCard({ flex, bg, label, labelColor, value, valueColor }: {
  flex: number; bg: string; label: string; labelColor: string; value: string; valueColor: string
}) {
  return (
    <div style={{ flex, background: bg, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, color: valueColor, margin: 0, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  )
}

function LegendItem({ color, textColor, label }: { color: string; textColor: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: color === 'transparent' ? '1.5px solid #D1D5DB' : 'none', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

function SignOutButton({ name }: { name: string }) {
  return (
    <button
      onClick={async () => {
        const { signOut } = await import('next-auth/react')
        signOut({ callbackUrl: '/login' })
      }}
      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
    >
      {name} · Sign out
    </button>
  )
}
