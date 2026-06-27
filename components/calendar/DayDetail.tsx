'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  date: string
  entries: Record<string, unknown[]>
  canEdit: boolean
  showScores: boolean
  role: string
  dailyTargets?: Record<string, number>
  earnedXP: number
  name: string
}

const TOTAL_QUESTS = 15

const ALL_QUESTS = [
  { track: 'sport',                icon: '🏃', title: 'Sport / 运动',              category: 'Active', xp: 10 },
  { track: 'math',                 icon: '🔢', title: 'Math / 数学',               category: 'Mind',   xp: 10 },
  { track: 'books',                icon: '📚', title: 'Books / 读书',              category: 'Mind',   xp: 10 },
  { track: 'chinese',              icon: '🀄', title: 'Chinese / 中文阅读',         category: 'Mind',   xp: 10 },
  { track: 'swedish',              icon: '🇸🇪', title: 'Swedish / 瑞典语',          category: 'Mind',   xp: 10 },
  { track: 'french',               icon: '🇫🇷', title: 'French / 法语',             category: 'Mind',   xp: 10 },
  { track: 'word_english_finnish', icon: '🇫🇮', title: 'Finnish words / 芬兰单词',  category: 'Mind',   xp: 10 },
  { track: 'word_english_chinese', icon: '🀄', title: 'Chinese words / 中文单词',  category: 'Mind',   xp: 10 },
  { track: 'word_english_swedish', icon: '🇸🇪', title: 'Swedish words / 瑞典单词', category: 'Mind',   xp: 10 },
  { track: 'word_english_french',  icon: '🇫🇷', title: 'French words / 法语单词',  category: 'Mind',   xp: 10 },
  { track: 'piano',                icon: '🎹', title: 'Piano / 钢琴',              category: 'Mind',   xp: 10 },
  { track: 'english',              icon: '✍️', title: 'English / 英文写作',         category: 'Mind',   xp: 10 },
  { track: 'finnish',              icon: '🇫🇮', title: 'Finnish / 芬兰语写作',      category: 'Mind',   xp: 10 },
  { track: 'science',              icon: '🔬', title: 'Science / 科学',             category: 'Mind',   xp: 10 },
  { track: 'ai_project',           icon: '🤖', title: 'AI Project / AI项目',       category: 'Mind',   xp: 10 },
] as const

type Category = 'Active' | 'Mind' | 'Home' | 'Family'

const CATEGORY_STYLE: Record<Category, { bg: string; color: string }> = {
  Active: { bg: '#EFF6FF', color: '#1D4ED8' },
  Mind:   { bg: '#F5F3FF', color: '#7C3AED' },
  Home:   { bg: '#FFF7ED', color: '#C2410C' },
  Family: { bg: '#FDF2F8', color: '#BE185D' },
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

export default function DayDetail({ date, entries, canEdit, role, dailyTargets, earnedXP, name }: Props) {
  const d = new Date(date + 'T12:00:00')
  const displayDate = d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

  const completedCount = ALL_QUESTS.filter(q => isDone(q.track, entries, dailyTargets)).length
  const totalXP = TOTAL_QUESTS * 10
  const pct = Math.round((earnedXP / totalXP) * 100)

  const pending = ALL_QUESTS.filter(q => !isDone(q.track, entries, dailyTargets))
  const completed = ALL_QUESTS.filter(q => isDone(q.track, entries, dailyTargets))

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", minHeight: '100vh', background: '#FFFBF5' }}>
      {/* Navy Header */}
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >
            {name} · Sign out
          </button>
        </div>

        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20, textDecoration: 'none', marginBottom: 10 }}
        >
          ←
        </Link>

        <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
          🌞 SUMMERQUEST
        </p>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 600, color: '#fff', margin: 0 }}>
          {displayDate}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>
          Summer 2026
        </p>
      </header>

      <div style={{ padding: '0 16px 32px' }}>
        {/* XP Progress Card */}
        <div style={{ background: '#fff', borderRadius: 22, margin: '18px 0 0', padding: 18, boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>TODAY&apos;S XP</p>
              <p style={{ margin: 0, lineHeight: 1.1 }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 600, color: '#F59E0B' }}>{earnedXP}</span>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: '#9CA3AF' }}> / {totalXP}</span>
              </p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: 18, padding: '12px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: 26 }}>⭐</span>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: '#92400E', margin: 0 }}>
                {pct}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 10, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)', borderRadius: 999 }} />
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700, margin: 0 }}>
            {completedCount} of {TOTAL_QUESTS} quests done today
            {canEdit && ' — keep going! / 继续加油！'}
          </p>
        </div>

        {/* Pending quests */}
        {pending.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              To Do / 待完成
            </p>
            {pending.map(q => <QuestCard key={q.track} quest={q} done={false} date={date} progress={progressLabel(q.track, entries, dailyTargets)} canEdit={canEdit} />)}
          </div>
        )}

        {/* Completed quests */}
        {completed.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Done / 已完成 ✓
            </p>
            {completed.map(q => <QuestCard key={q.track} quest={q} done={true} date={date} progress={progressLabel(q.track, entries, dailyTargets)} canEdit={canEdit} />)}
          </div>
        )}
      </div>
    </div>
  )
}

interface QuestCardProps {
  quest: typeof ALL_QUESTS[number]
  done: boolean
  date: string
  progress: string | null
  canEdit: boolean
}

function QuestCard({ quest, done, date, progress, canEdit }: QuestCardProps) {
  const cat = quest.category as Category
  const catStyle = CATEGORY_STYLE[cat]

  return (
    <Link
      href={`/day/${date}/${quest.track}`}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}
    >
      <div style={{
        background: done ? '#F0FDF4' : '#fff',
        border: `2px solid ${done ? '#86EFAC' : '#F3F4F6'}`,
        borderRadius: 18, padding: '15px 14px',
        display: 'flex', alignItems: 'center', gap: 13,
        transition: 'all 0.15s',
      }}>
        {/* Icon */}
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: done ? '#D1FAE5' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>
          {quest.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 15, fontWeight: 800, color: done ? '#9CA3AF' : '#111827',
            textDecoration: done ? 'line-through' : 'none',
            margin: '0 0 5px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {quest.title}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: catStyle.bg, color: catStyle.color }}>
              {cat}
            </span>
            {progress ? (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: done ? '#D1FAE5' : '#FEF3C7', color: done ? '#065F46' : '#92400E' }}>
                {progress}
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: done ? '#D1FAE5' : '#FEF3C7', color: done ? '#065F46' : '#92400E' }}>
                ⭐ {quest.xp} XP
              </span>
            )}
          </div>
        </div>

        {/* Check circle */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: done ? '#10B981' : '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: done ? '#fff' : '#D1D5DB', fontSize: 14, fontWeight: 800,
        }}>
          {done ? '✓' : ''}
        </div>
      </div>
    </Link>
  )
}
