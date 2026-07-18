'use client'

import { useState, useCallback, useEffect } from 'react'
import type React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PublicUser {
  id: number
  name: string
  role: 'child' | 'guardian' | 'admin'
}

const ROLE_LABEL: Record<PublicUser['role'], string> = {
  child: 'Kid',
  guardian: 'Guardian',
  admin: 'Admin',
}

const ACCENT = '#4FD1FF'
const ACCENT_SOFT = '#A6E9FF'
const FAMILY_STORAGE_KEY = 'summerquest.familyCode'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [familyCode, setFamilyCode] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [familyInput, setFamilyInput] = useState('')
  const [familyLoading, setFamilyLoading] = useState(true)
  const [selected, setSelected] = useState<PublicUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(FAMILY_STORAGE_KEY) ?? ''
    if (!stored) {
      setFamilyLoading(false)
      return
    }

    fetch(`/api/families?code=${encodeURIComponent(stored)}`)
      .then(r => r.json())
      .then(d => {
        if (d.family?.code) {
          setFamilyCode(d.family.code)
          setFamilyName(d.family.name ?? d.family.code)
          setFamilyInput(d.family.code)
        } else {
          window.localStorage.removeItem(FAMILY_STORAGE_KEY)
        }
      })
      .finally(() => setFamilyLoading(false))
  }, [])

  useEffect(() => {
    if (!familyCode) return
    fetch(`/api/users?family=${encodeURIComponent(familyCode)}`)
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
  }, [familyCode])

  async function saveFamily(e: React.FormEvent) {
    e.preventDefault()
    const code = familyInput.trim()
    if (!code) return
    setError('')
    setFamilyLoading(true)
    const res = await fetch(`/api/families?code=${encodeURIComponent(code)}`)
    const data = await res.json()
    setFamilyLoading(false)
    if (!res.ok || !data.family?.code) {
      setError(data.error ?? 'Family not found.')
      return
    }
    window.localStorage.setItem(FAMILY_STORAGE_KEY, data.family.code)
    setFamilyCode(data.family.code)
    setFamilyName(data.family.name ?? data.family.code)
    setSelected(null)
    setPin('')
    setUsers([])
  }

  function changeFamily() {
    window.localStorage.removeItem(FAMILY_STORAGE_KEY)
    setFamilyCode('')
    setFamilyName('')
    setFamilyInput('')
    setSelected(null)
    setUsers([])
    setPin('')
    setError('')
  }

  const doSignIn = useCallback(async (pinValue: string) => {
    if (!selected) return
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      name: selected.name,
      pin: pinValue,
      familyCode,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Wrong PIN - try again.')
      setPin('')
    } else {
      router.push('/')
      router.refresh()
    }
  }, [selected, router])

  const handleNumpad = useCallback((digit: string) => {
    if (loading || !selected) return
    setError('')
    setPin(prev => {
      const next = (prev + digit).slice(0, 4)
      if (next.length === 4) setTimeout(() => doSignIn(next), 380)
      return next
    })
  }, [loading, selected, doSignIn])

  const handleClear = () => { setPin(''); setError('') }

  const grouped = {
    child: users.filter(u => u.role === 'child'),
    guardian: users.filter(u => u.role === 'guardian'),
    admin: users.filter(u => u.role === 'admin'),
  }

  if (familyLoading) {
    return (
      <div className="hud-page flex flex-col items-center justify-center px-5">
        <p style={{ color: ACCENT, fontSize: 13, fontWeight: 700 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="hud-page flex flex-col items-center px-5" style={{ paddingTop: 56, paddingBottom: 32 }}>
      <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SOFT})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px ${ACCENT}55`, marginBottom: 14,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0E17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: '#fff', margin: 0 }}>
          SummerQuest
        </h1>
        <p style={{ fontSize: 11, color: ACCENT, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', marginTop: 6 }}>
          Summer 2026
        </p>
      </div>

      <div className="hud-card w-full max-w-sm" style={{ borderRadius: 24, padding: '24px 20px' }}>
        {!familyCode ? (
          <form onSubmit={saveFamily} className="space-y-4">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7793', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>
                Family code
              </p>
              <p style={{ fontSize: 13, color: '#9AA4C0', lineHeight: 1.5, margin: '0 0 14px' }}>
                Enter this once on this device. Next time, you will go straight to the normal login page.
              </p>
              <input
                value={familyInput}
                onChange={(e) => setFamilyInput(e.target.value)}
                autoFocus
                placeholder="e.g. summerquest"
                className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-3 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
            {error && <p style={{ color: '#FF5C7A', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={!familyInput.trim() || familyLoading}
              className="w-full rounded-lg py-3 text-sm font-bold disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SOFT})`, color: '#0A0E17' }}
            >
              Continue
            </button>
          </form>
        ) : !selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7793', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>
                  Who are you?
                </p>
                <p style={{ fontSize: 11, color: '#4FD1FF', fontWeight: 700, margin: 0 }}>{familyName}</p>
              </div>
              <button
                type="button"
                onClick={changeFamily}
                style={{ background: '#12182A', color: '#9AA4C0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '7px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Change
              </button>
            </div>
            {(['child', 'guardian', 'admin'] as const).map(role => {
              const group = grouped[role]
              if (group.length === 0) return null
              return (
                <div key={role} style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5470', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>
                    {ROLE_LABEL[role]}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setSelected(u); setPin(''); setError('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          border: '1px solid rgba(255,255,255,0.08)', background: '#12182A',
                          borderRadius: 16, padding: '12px 16px',
                          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
                          color: '#EDEFF5', cursor: 'pointer', transition: 'all 0.18s',
                        }}
                      >
                        <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: '#C7CEE0' }}>
                          {initials(u.name)}
                        </span>
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <button
                onClick={() => { setSelected(null); setPin(''); setError('') }}
                style={{ background: '#12182A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                  {selected.name}
                </p>
                <p style={{ fontSize: 11, color: '#6B7793', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                  {ROLE_LABEL[selected.role]}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7793', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 14px' }}>
              PIN
            </p>
            <div className="flex justify-center" style={{ gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: i < pin.length ? ACCENT : 'transparent',
                    border: `2px solid ${i < pin.length ? ACCENT : 'rgba(255,255,255,0.2)'}`,
                    boxShadow: i < pin.length ? `0 0 8px ${ACCENT}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            {error && <p style={{ color: '#FF5C7A', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>{error}</p>}
            {loading && <p style={{ color: ACCENT, fontSize: 12, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>Logging in...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
              {[1,2,3,4,5,6,7,8,9].map(d => (
                <NumpadButton key={d} onClick={() => handleNumpad(String(d))} disabled={loading || pin.length >= 4}>
                  {d}
                </NumpadButton>
              ))}
              <button
                onClick={handleClear}
                disabled={loading}
                style={{
                  borderRadius: 14, border: '1px solid rgba(255,92,122,0.2)', background: 'rgba(255,92,122,0.08)',
                  fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700,
                  color: '#FF5C7A', padding: '16px 8px', cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <NumpadButton onClick={() => handleNumpad('0')} disabled={loading || pin.length >= 4}>0</NumpadButton>
              <button
                onClick={() => setPin(p => p.slice(0, -1))}
                disabled={loading}
                style={{
                  borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: '#12182A',
                  fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700,
                  color: '#9AA4C0', padding: '16px 8px', cursor: 'pointer',
                }}
              >
                ←
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function NumpadButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: '#12182A',
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700,
        color: '#EDEFF5', padding: '16px 8px', cursor: 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
