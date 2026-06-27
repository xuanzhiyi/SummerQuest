'use client'

import { useEffect, useState } from 'react'

interface Connection { leftId: string; rightId: string }

interface LineCoords {
  x1: number; y1: number; x2: number; y2: number
  color: string; key: string
}

interface Props {
  connections: Connection[]
  leftRefs: Map<string, HTMLDivElement>
  rightRefs: Map<string, HTMLDivElement>
  containerRef: React.RefObject<HTMLDivElement | null>
  correctMap?: Record<string, boolean>
  submitted: boolean
}

export default function PairConnectionLayer({
  connections, leftRefs, rightRefs, containerRef, correctMap, submitted,
}: Props) {
  const [lines, setLines] = useState<LineCoords[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    const newLines: LineCoords[] = connections.map((conn) => {
      const lEl = leftRefs.get(conn.leftId)
      const rEl = rightRefs.get(conn.rightId)
      if (!lEl || !rEl) return { x1: 0, y1: 0, x2: 0, y2: 0, color: '#6366f1', key: conn.leftId }

      const lR = lEl.getBoundingClientRect()
      const rR = rEl.getBoundingClientRect()

      let color = '#f59e0b' // amber during game
      if (submitted && correctMap) {
        color = correctMap[conn.leftId] ? '#22c55e' : '#ef4444'
      }

      return {
        x1: lR.right - rect.left,
        y1: lR.top + lR.height / 2 - rect.top,
        x2: rR.left - rect.left,
        y2: rR.top + rR.height / 2 - rect.top,
        color,
        key: conn.leftId,
      }
    })

    setLines(newLines)
  }, [connections, leftRefs, rightRefs, containerRef, correctMap, submitted])

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {lines.map((l) => (
        <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={l.color} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      ))}
    </svg>
  )
}
