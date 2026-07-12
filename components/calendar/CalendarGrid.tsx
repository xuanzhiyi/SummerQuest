'use client'

import { useState } from 'react'
import type React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { type DayTile, TOTAL_QUESTS } from '@/types'

interface Props {
  tiles: DayTile[]
  role: string
  name: string
  perfectThreshold?: number | null
}

const ACCENT = '#4FD1FF'
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKEND_IDX = new Set([5, 6])
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki' }).format(new Date())

function isFuture(date: string) { return date > TODAY }
function isToday(date: string) { return date === TODAY }

function getDowIndex(date: string) {
  const d = new Date(date + 'T12:00:00').getDay()
  return d === 0 ? 6 : d - 1
}

export default function CalendarGrid({ tiles, role, name, perfectThreshold }: Props) {
  const perfectGoal = perfectThreshold ?? TOTAL_QUESTS
  const months = [...new Set(tiles.map(t => t.date.slice(0, 7)))].sort()
  const initialMonth = months.find(m => m === TODAY.slice(0, 7)) ?? months[0] ?? TODAY.slice(0, 7)
  const [activeMonth, setActiveMonth] = useState(initialMonth)

  const monthIdx = months.indexOf(activeMonth)
  const canPrev = monthIdx > 0
  const canNext = monthIdx < months.length - 1
  const monthTiles = tiles.filter(t => t.date.startsWith(activeMonth))

  const pastTiles = tiles.filter(t => !isFuture(t.date))
  const perfectDays = pastTiles.filter(t => t.completed_quests >= perfectGoal).length
  const totalXP = pastTiles.reduce((s, t) => s + t.total_points, 0)
  const totalQuestsDone = pastTiles.reduce((s, t) => s + t.completed_quests, 0)

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
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      <header style={{ padding: '44px 20px 20px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 22, fontSize: 11 }}>
          <div className="flex gap-4">
            {role === 'admin' && (
              <>
                <Link href="/admin/settings" style={navLinkStyle}>Settings</Link>
                <Link href="/admin/rewards" style={navLinkStyle}>Rewards</Link>
              </>
            )}
            {role === 'guardian' && <Link href="/settings" style={navLinkStyle}>Settings</Link>}
            <Link href="/progress" style={navLinkStyle}>Progress</Link>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={signOutStyle}>
            {name} · Sign out
          </button>
        </div>

        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 3, margin: '0 0 16px' }}>
          SummerQuest
        </p>

        <div className="flex items-center justify-between">
          <MonthButton disabled={!canPrev} onClick={() => canPrev && setActiveMonth(months[monthIdx - 1])} direction="prev" />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center', minWidth: 190 }}>
            {monthLabel}
          </h2>
          <MonthButton disabled={!canNext} onClick={() => canNext && setActiveMonth(months[monthIdx + 1])} direction="next" />
        </div>
      </header>

      <div style={{ display: 'flex', gap: 10, padding: '0 16px 20px' }}>
        <StatCard flex={1} color="#A3E635" label="Perfect" value={String(perfectDays)} />
        <StatCard flex={1.4} color="#FFB648" label="XP Earned" value={String(totalXP)} />
        <StatCard flex={1} color="#4FD1FF" label="Quests" value={String(totalQuestsDone)} />
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DAY_HEADERS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: WEEKEND_IDX.has(i) ? '#FF7A9C' : '#4A5470' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {wk.map((tile, ci) =>
                tile
                  ? <DayCell key={tile.date} tile={tile} perfectGoal={perfectGoal} />
                  : <div key={`e-${wi}-${ci}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, padding: '0 16px 40px' }}>
        <LegendItem color="rgba(163,230,53,0.14)" border="1px solid #A3E635" label="All done" />
        <LegendItem color="rgba(255,182,72,0.14)" border="1px solid #FFB648" label="Partial" />
        <LegendItem color="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.08)" label="No quests" />
        <LegendItem color="transparent" border="1px solid rgba(255,255,255,0.15)" label="Future" />
      </div>
    </div>
  )
}

function MonthButton({ disabled, onClick, direction }: { disabled: boolean; onClick: () => void; direction: 'prev' | 'next' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 38, height: 38, borderRadius: 11, background: '#12182A',
        border: '1px solid rgba(255,255,255,0.08)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}

function DayCell({ tile, perfectGoal }: { tile: DayTile; perfectGoal: number }) {
  const today = isToday(tile.date)
  const future = isFuture(tile.date)
  const dayNum = parseInt(tile.date.slice(8, 10))
  const done = tile.completed_quests
  const allDone = done >= perfectGoal
  const partial = done > 0 && !allDone

  let bg = 'rgba(255,255,255,0.04)'
  let color = '#4A5470'
  let border = '1px solid rgba(255,255,255,0.04)'
  let boxShadow = 'none'

  if (future) {
    bg = 'transparent'
    color = '#2A3350'
    border = '1px solid rgba(255,255,255,0.03)'
  } else if (today) {
    bg = 'rgba(255,255,255,0.05)'
    color = ACCENT
    border = `2px solid ${ACCENT}`
    boxShadow = `0 0 10px ${ACCENT}55`
  } else if (allDone) {
    bg = 'rgba(163,230,53,0.14)'
    color = '#A3E635'
    border = '1px solid rgba(163,230,53,0.25)'
  } else if (partial) {
    bg = 'rgba(255,182,72,0.14)'
    color = '#FFB648'
    border = '1px solid rgba(255,182,72,0.25)'
  }

  const inner = (
    <div style={{
      aspectRatio: '1', borderRadius: '50%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: bg, border,
      boxShadow, cursor: future ? 'default' : 'pointer',
    }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>
        {dayNum}
      </span>
      {done > 0 && !future && (
        <span style={{ fontSize: 8, fontWeight: 700, color, opacity: 0.85, marginTop: 2 }}>
          {done}/{TOTAL_QUESTS}
        </span>
      )}
    </div>
  )

  if (future) return inner
  return <Link href={`/day/${tile.date}`} style={{ textDecoration: 'none' }}>{inner}</Link>
}

function StatCard({ flex, color, label, value }: { flex: number; color: string; label: string; value: string }) {
  return (
    <div style={{ flex, background: `${color}14`, border: `1px solid ${color}2e`, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color, margin: 0, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  )
}

function LegendItem({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 11, height: 11, borderRadius: '50%', background: color, border, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7793' }}>{label}</span>
    </div>
  )
}

const navLinkStyle = {
  color: '#6B7793',
  textDecoration: 'none',
  fontWeight: 700,
  letterSpacing: 0.3,
} satisfies React.CSSProperties

const signOutStyle = {
  background: 'none',
  border: 'none',
  color: '#6B7793',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'inherit',
} satisfies React.CSSProperties
