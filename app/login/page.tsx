'use client'

import { useState, useCallback, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PublicUser {
  id: number
  name: string
  role: 'child' | 'guardian' | 'admin'
}

const ROLE_ICON: Record<string, string> = {
  child:    '🧒',
  guardian: '👴',
  admin:    '⚙️',
}

const ROLE_LABEL: Record<string, string> = {
  child:    'Kid / 孩子',
  guardian: 'Guardian / 监护人',
  admin:    'Admin',
}

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [selected, setSelected] = useState<PublicUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users ?? []))
  }, [])

  const doSignIn = useCallback(async (pinValue: string) => {
    if (!selected) return
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      name: selected.name,
      pin: pinValue,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Wrong PIN — try again. / 密码错误，请重试')
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
    child:    users.filter(u => u.role === 'child'),
    guardian: users.filter(u => u.role === 'guardian'),
    admin:    users.filter(u => u.role === 'admin'),
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center pt-16 px-6 pb-12"
      style={{ background: 'linear-gradient(168deg, #081929 0%, #0E3254 38%, #B8600A 78%, #E8860E 100%)' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <span className="animate-sun inline-block" style={{ fontSize: 80 }}>🌞</span>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 46, fontWeight: 600, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          SummerQuest
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', marginTop: 6 }}>
          ✦ Summer 2026 ✦
        </p>
      </div>

      <div className="w-full max-w-sm" style={{ background: '#fff', borderRadius: 28, padding: '28px 22px 24px', boxShadow: '0 28px 80px rgba(0,0,0,0.4)' }}>
        {!selected ? (
          /* User picker */
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              Who are you? / 你是谁？
            </p>
            {(['child', 'guardian', 'admin'] as const).map(role => {
              const group = grouped[role]
              if (group.length === 0) return null
              return (
                <div key={role} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                    {ROLE_LABEL[role]}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setSelected(u); setPin(''); setError('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          border: '2px solid #E5E7EB', background: '#F9FAFB',
                          borderRadius: 16, padding: '12px 16px',
                          fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                          color: '#111827', cursor: 'pointer', transition: 'all 0.18s',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{ROLE_ICON[role]}</span>
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          /* PIN entry */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => { setSelected(null); setPin(''); setError('') }}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
              >
                ←
              </button>
              <div>
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.1 }}>
                  {ROLE_ICON[selected.role]} {selected.name}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                  {ROLE_LABEL[selected.role]}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
              PIN / 密码
            </p>
            <div className="flex justify-center gap-5 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: 17, height: 17, borderRadius: '50%',
                    background: i < pin.length ? '#F59E0B' : 'transparent',
                    border: `2px solid ${i < pin.length ? '#F59E0B' : '#D1D5DB'}`,
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            {loading && <p className="text-amber-600 text-sm text-center mb-3 font-semibold">Logging in… / 登录中…</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
              {[1,2,3,4,5,6,7,8,9].map(d => (
                <button
                  key={d}
                  onClick={() => handleNumpad(String(d))}
                  disabled={loading || pin.length >= 4}
                  style={{
                    borderRadius: 14, border: '2px solid #F3F4F6', background: '#F9FAFB',
                    fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 700,
                    color: '#111827', padding: '17px 8px', cursor: 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={handleClear}
                disabled={loading}
                style={{
                  borderRadius: 14, border: '2px solid #FEE2E2', background: '#FEF2F2',
                  fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
                  color: '#EF4444', padding: '17px 8px', cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                onClick={() => handleNumpad('0')}
                disabled={loading || pin.length >= 4}
                style={{
                  borderRadius: 14, border: '2px solid #F3F4F6', background: '#F9FAFB',
                  fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 700,
                  color: '#111827', padding: '17px 8px', cursor: 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                0
              </button>
              <button
                onClick={() => setPin(p => p.slice(0, -1))}
                disabled={loading}
                style={{
                  borderRadius: 14, border: '2px solid #F3F4F6', background: '#F9FAFB',
                  fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700,
                  color: '#6B7280', padding: '17px 8px', cursor: 'pointer',
                }}
              >
                ⌫
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
