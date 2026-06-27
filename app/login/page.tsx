'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type UserType = 'child' | 'viewer' | 'admin'

const USER_LABELS: Record<UserType, string> = {
  child: 'Me',
  viewer: 'Grandparents / 祖父母',
  admin: 'Admin',
}

export default function LoginPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>('child')
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doSignIn = useCallback(async (pinValue: string) => {
    setError('')
    setLoading(true)
    const credentials =
      userType === 'admin'
        ? { email, password }
        : userType === 'child'
        ? { username: 'hansen', password: pinValue }
        : { username: 'viewer', password: pinValue }

    const res = await signIn('credentials', { ...credentials, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Wrong PIN — try again. / 密码错误，请重试')
      setPin('')
    } else {
      router.push('/')
      router.refresh()
    }
  }, [userType, email, password, router])

  const handleNumpad = useCallback((digit: string) => {
    if (loading) return
    setError('')
    setPin(prev => {
      const next = (prev + digit).slice(0, 4)
      if (next.length === 4) {
        setTimeout(() => doSignIn(next), 380)
      }
      return next
    })
  }, [loading, doSignIn])

  const handleClear = () => { setPin(''); setError('') }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doSignIn('')
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

      {/* Card */}
      <div className="w-full max-w-sm" style={{ background: '#fff', borderRadius: 28, padding: '28px 22px 24px', boxShadow: '0 28px 80px rgba(0,0,0,0.4)' }}>
        {/* User selector */}
        <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          Who are you? / 你是谁？
        </p>
        <div className="flex gap-2 mb-6">
          {(['child', 'viewer', 'admin'] as UserType[]).map(u => (
            <button
              key={u}
              onClick={() => { setUserType(u); setPin(''); setError('') }}
              style={{
                flex: u === 'viewer' ? 1.6 : 1,
                border: `2px solid ${userType === u ? '#F59E0B' : '#E5E7EB'}`,
                background: userType === u ? '#FEF3C7' : '#F9FAFB',
                color: userType === u ? '#92400E' : '#374151',
                borderRadius: 14,
                padding: '14px 6px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {USER_LABELS[u]}
            </button>
          ))}
        </div>

        {userType === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 mt-1 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 mt-1 text-sm text-gray-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        ) : (
          <>
            {/* PIN dots */}
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

            {/* Numpad */}
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
                    transition: 'all 0.18s',
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
                  color: '#EF4444', padding: '17px 8px', cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                Clear / 清除
              </button>
              <button
                onClick={() => handleNumpad('0')}
                disabled={loading || pin.length >= 4}
                style={{
                  borderRadius: 14, border: '2px solid #F3F4F6', background: '#F9FAFB',
                  fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 700,
                  color: '#111827', padding: '17px 8px', cursor: 'pointer', transition: 'all 0.18s',
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
                  color: '#6B7280', padding: '17px 8px', cursor: 'pointer', transition: 'all 0.18s',
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
