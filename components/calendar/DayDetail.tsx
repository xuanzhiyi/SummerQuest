'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { QUEST_DEFINITIONS, type QuestCategory, type QuestDefinition } from '@/lib/tracks'

interface Props {
  date: string
  entries: Record<string, unknown[]>
  canEdit: boolean
  showScores: boolean
  role: string
  dailyTargets?: Record<string, number>
  earnedXP: number
  xpPerTrack?: Record<string, number>
  name: string
}

const ACCENT = '#4FD1FF'
const ACCENT_SOFT = '#A6E9FF'

const CATEGORY_STYLE: Record<QuestCategory, { bg: string; color: string }> = {
  Active: { bg: 'rgba(79,209,255,0.12)', color: '#4FD1FF' },
  Mind: { bg: 'rgba(182,156,255,0.12)', color: '#B69CFF' },
  Home: { bg: 'rgba(255,182,72,0.12)', color: '#FFB648' },
  Family: { bg: 'rgba(255,92,168,0.12)', color: '#FF5CA8' },
}

function entryCount(track: string, entries: Record<string, unknown[]>) {
  return (entries[track] ?? []).length
}

function isDone(track: string, entries: Record<string, unknown[]>, dailyTargets?: Record<string, number>) {
  const count = entryCount(track, entries)
  if (count === 0) return false
  return count >= (dailyTargets?.[track] ?? 1)
}

function progressLabel(track: string, entries: Record<string, unknown[]>, dailyTargets?: Record<string, number>) {
  if (!track.startsWith('word_')) return null
  const count = entryCount(track, entries)
  const target = dailyTargets?.[track] ?? 1
  if (count === 0) return null
  return `${count}/${target} sets`
}

function completedTime(track: string, entries: Record<string, unknown[]>) {
  const rows = entries[track] ?? []
  if (rows.length === 0) return null
  const latest = rows[rows.length - 1] as Record<string, unknown>
  const ts = latest.created_at
  if (!ts) return null
  const d = new Date(ts as string)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function DayDetail({ date, entries, canEdit, role, dailyTargets, earnedXP, xpPerTrack, name }: Props) {
  const d = new Date(date + 'T12:00:00')
  const displayDate = d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

  const getXP = (track: string) => xpPerTrack?.[track] ?? 10
  const completedCount = QUEST_DEFINITIONS.filter((q) => isDone(q.track, entries, dailyTargets)).length
  const totalXP = QUEST_DEFINITIONS.reduce((sum, q) => sum + getXP(q.track), 0)
  const pct = totalXP > 0 ? Math.min(100, Math.round((earnedXP / totalXP) * 100)) : 0

  const pending = QUEST_DEFINITIONS.filter((q) => !isDone(q.track, entries, dailyTargets))
  const completed = QUEST_DEFINITIONS.filter((q) => isDone(q.track, entries, dailyTargets))

  const circumference = 2 * Math.PI * 27
  const ringDasharray = `${(pct / 100) * circumference} ${circumference}`

  return (
    <div style={{
      fontFamily: "'Sora', sans-serif",
      minHeight: '100vh',
      width: '100%',
      background: '#0A0E17',
      backgroundImage: 'radial-gradient(ellipse 900px 500px at 50% -10%, rgba(124,92,255,0.16), transparent)',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      <header style={{ padding: '44px 20px 24px', position: 'relative' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 22, fontSize: 11 }}>
          <div className="flex gap-4">
            {role === 'admin' && (
              <>
                <Link href="/admin/users" style={{ color: '#6B7793', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.3 }}>Users</Link>
                <Link href="/admin/settings" style={{ color: '#6B7793', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.3 }}>System</Link>
                <Link href="/admin/rewards" style={{ color: '#6B7793', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.3 }}>Rewards</Link>
              </>
            )}
            {role === 'guardian' && (
              <Link href="/settings" style={{ color: '#6B7793', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.3 }}>Settings</Link>
            )}
            <Link href="/progress" style={{ color: '#6B7793', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.3 }}>Progress</Link>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ background: 'none', border: 'none', color: '#6B7793', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {name} / Sign out
          </button>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#12182A',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            borderRadius: 999,
            background: '#12182A',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C7CEE0', letterSpacing: 1 }}>
              {completedCount}/{QUEST_DEFINITIONS.length} DONE
            </span>
          </div>
        </div>

        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 3, margin: '20px 0 6px' }}>
          SummerQuest
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
          {displayDate}
        </h1>
        <p style={{ fontSize: 13, color: '#6B7793', fontWeight: 600, marginTop: 6 }}>
          Summer 2026
        </p>
      </header>

      <div style={{ padding: '0 16px 40px' }}>
        <div style={{
          background: 'linear-gradient(180deg, #131A2C, #10151F)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.07)',
          padding: 22,
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        }}>
          <div className="flex justify-between items-start" style={{ marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7793', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px' }}>
                Today's XP
              </p>
              <p style={{ margin: 0, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: ACCENT }}>{earnedXP}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#4A5470' }}>/ {totalXP}</span>
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={ringDasharray}
                  style={{ filter: `drop-shadow(0 0 6px ${ACCENT})` }}
                />
              </svg>
            </div>
          </div>
          <div style={{ height: 12, background: '#1A2136', borderRadius: 999, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_SOFT})`,
              borderRadius: 999,
              boxShadow: `0 0 12px ${ACCENT}`,
              transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <p style={{ fontSize: 12, color: '#6B7793', fontWeight: 700, margin: 0 }}>
            {completedCount} of {QUEST_DEFINITIONS.length} quests done today
            {canEdit && ' - keep going!'}
          </p>
        </div>

        {pending.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5470', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              To Do
            </p>
            {pending.map((q) => <QuestCard key={q.track} quest={q} done={false} date={date} progress={progressLabel(q.track, entries, dailyTargets)} xp={getXP(q.track)} />)}
          </div>
        )}

        {completed.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5470', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              Done
            </p>
            {completed.map((q) => <QuestCard key={q.track} quest={q} done={true} date={date} progress={progressLabel(q.track, entries, dailyTargets)} xp={getXP(q.track)} completedAt={completedTime(q.track, entries)} />)}
          </div>
        )}
      </div>
    </div>
  )
}

interface QuestCardProps {
  quest: QuestDefinition
  done: boolean
  date: string
  progress: string | null
  xp: number
  completedAt?: string | null
}

function QuestCard({ quest, done, date, progress, xp, completedAt }: QuestCardProps) {
  const catStyle = CATEGORY_STYLE[quest.category]
  const progressOrXp = progress ?? `${xp} XP`

  return (
    <Link href={`/day/${date}/${quest.track}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
      <div style={{
        background: done ? 'rgba(163,230,53,0.05)' : '#12182A',
        border: done ? '1px solid rgba(163,230,53,0.18)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        transition: 'all 0.15s',
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          flexShrink: 0,
          background: done ? 'rgba(163,230,53,0.14)' : 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: done ? '#A3E635' : '#C7CEE0', letterSpacing: 0.3 }}>
            {quest.code}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 15,
            fontWeight: 700,
            color: done ? '#6B7793' : '#EDEFF5',
            textDecoration: done ? 'line-through' : 'none',
            margin: '0 0 6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {quest.title}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: catStyle.bg, color: catStyle.color }}>
              {quest.category}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: done ? 'rgba(163,230,53,0.14)' : 'rgba(255,255,255,0.06)',
              color: done ? '#A3E635' : '#9AA4C0',
            }}>
              {progressOrXp}
            </span>
            {done && completedAt && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4A5470' }}>
                Done {completedAt}
              </span>
            )}
          </div>
        </div>

        <div style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          flexShrink: 0,
          background: done ? '#A3E635' : 'rgba(255,255,255,0.06)',
          border: done ? 'none' : '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {done && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0E17" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  )
}
