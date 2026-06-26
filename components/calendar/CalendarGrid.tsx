'use client'

import Link from 'next/link'
import { type DayTile, EFFORT_SIGNAL_LABEL } from '@/types'

interface Props {
  tiles: DayTile[]
  role: string
}

function isToday(date: string) {
  return date === new Date().toISOString().slice(0, 10)
}

function isPast(date: string) {
  return date < new Date().toISOString().slice(0, 10)
}

function isFuture(date: string) {
  return date > new Date().toISOString().slice(0, 10)
}

export default function CalendarGrid({ tiles, role }: Props) {
  // Group tiles by week (Mon–Sun rows)
  const weeks: DayTile[][] = []
  let week: DayTile[] = []

  for (const tile of tiles) {
    const dayOfWeek = new Date(tile.date + 'T12:00:00').getDay() // 0=Sun
    const mon = dayOfWeek === 1
    if (mon && week.length > 0) {
      weeks.push(week)
      week = []
    }
    week.push(tile)
  }
  if (week.length > 0) weeks.push(week)

  return (
    <div className="space-y-2">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-gray-400 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        // Pad week to 7 cols
        const firstDay = new Date(week[0].date + 'T12:00:00').getDay()
        const prefixPad = firstDay === 0 ? 6 : firstDay - 1 // Mon=0 offset
        return (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {prefixPad > 0 &&
              Array.from({ length: prefixPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {week.map((tile) => (
              <Tile key={tile.date} tile={tile} role={role} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function Tile({ tile, role }: { tile: DayTile; role: string }) {
  const today = isToday(tile.date)
  const past = isPast(tile.date)
  const future = isFuture(tile.date)
  const dayNum = parseInt(tile.date.slice(8, 10))
  const monthShort = new Date(tile.date + 'T12:00:00').toLocaleString('en', { month: 'short' })

  const tileClass = [
    'rounded-xl p-2 flex flex-col items-center gap-0.5 text-center transition-all',
    today
      ? 'bg-amber-400 text-white shadow-lg ring-2 ring-amber-500 ring-offset-1'
      : past && tile.total_points > 0
      ? 'bg-white shadow-sm hover:shadow-md cursor-pointer'
      : past
      ? 'bg-white/60 hover:bg-white cursor-pointer'
      : 'bg-white/30 text-gray-400',
  ].join(' ')

  const content = (
    <div className={tileClass}>
      <span className="text-[10px] font-medium opacity-70">{monthShort}</span>
      <span className={`text-base font-bold leading-none ${today ? '' : 'text-gray-700'}`}>
        {dayNum}
      </span>
      {tile.total_points > 0 && (
        <span className={`text-[10px] font-semibold ${today ? 'text-white/90' : 'text-amber-600'}`}>
          +{tile.total_points}
        </span>
      )}
      {tile.effort_signal && (
        <span className="text-[11px]" title={EFFORT_SIGNAL_LABEL[tile.effort_signal]}>
          {tile.effort_signal === 'great'
            ? '🌟'
            : tile.effort_signal === 'good'
            ? '👍'
            : '🌱'}
        </span>
      )}
    </div>
  )

  if (future) return content

  return <Link href={`/day/${tile.date}`}>{content}</Link>
}
