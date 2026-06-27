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

function isFuture(date: string) {
  return date > new Date().toISOString().slice(0, 10)
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarGrid({ tiles, role }: Props) {
  // Group tiles by month
  const byMonth: { label: string; tiles: DayTile[] }[] = []
  for (const tile of tiles) {
    const label = new Date(tile.date + 'T12:00:00').toLocaleString('en', { month: 'long', year: 'numeric' })
    if (!byMonth.length || byMonth[byMonth.length - 1].label !== label) {
      byMonth.push({ label, tiles: [] })
    }
    byMonth[byMonth.length - 1].tiles.push(tile)
  }

  return (
    <div className="space-y-6">
      {byMonth.map(({ label, tiles: monthTiles }) => {
        // Build week rows (Mon–Sun)
        const weeks: (DayTile | null)[][] = []
        let week: (DayTile | null)[] = []

        // Pad start to Monday
        const firstDow = new Date(monthTiles[0].date + 'T12:00:00').getDay()
        const prefixPad = firstDow === 0 ? 6 : firstDow - 1
        for (let i = 0; i < prefixPad; i++) week.push(null)

        for (const tile of monthTiles) {
          week.push(tile)
          if (week.length === 7) { weeks.push(week); week = [] }
        }
        // Pad end
        if (week.length > 0) {
          while (week.length < 7) week.push(null)
          weeks.push(week)
        }

        return (
          <div key={label}>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{label}</h3>
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-gray-400 mb-1">
              {DOW.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="space-y-1.5">
              {weeks.map((wk, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1.5">
                  {wk.map((tile, ci) =>
                    tile ? <Tile key={tile.date} tile={tile} /> : <div key={`empty-${ci}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Tile({ tile }: { tile: DayTile }) {
  const today = isToday(tile.date)
  const future = isFuture(tile.date)
  const dayNum = parseInt(tile.date.slice(8, 10))
  const hasActivity = tile.total_points > 0

  const tileClass = [
    'rounded-xl px-1 py-2 flex flex-col items-center gap-0.5 text-center transition-all min-h-[62px] justify-center',
    today
      ? 'bg-amber-400 text-white shadow-lg ring-2 ring-amber-500 ring-offset-1'
      : hasActivity
      ? 'bg-white shadow-sm hover:shadow-md cursor-pointer'
      : future
      ? 'bg-white/30 text-gray-300'
      : 'bg-white/60 hover:bg-white cursor-pointer',
  ].join(' ')

  const effortEmoji =
    tile.effort_signal === 'great' ? '🌟'
    : tile.effort_signal === 'good' ? '👍'
    : tile.effort_signal === 'keep_practicing' ? '🌱'
    : null

  const inner = (
    <div className={tileClass}>
      <span className={`text-base font-bold leading-none ${today ? 'text-white' : future ? 'text-gray-300' : 'text-gray-700'}`}>
        {dayNum}
      </span>
      {hasActivity && (
        <span className={`text-[10px] font-semibold leading-tight ${today ? 'text-white/90' : 'text-amber-600'}`}>
          +{tile.total_points} pts
        </span>
      )}
      {effortEmoji && (
        <span className="text-[11px] leading-none" title={tile.effort_signal ? EFFORT_SIGNAL_LABEL[tile.effort_signal] : ''}>
          {effortEmoji}
        </span>
      )}
    </div>
  )

  if (future) return inner
  return <Link href={`/day/${tile.date}`}>{inner}</Link>
}
