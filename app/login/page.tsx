'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type LoginMode = 'admin' | 'child' | 'viewer'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('child')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const credentials =
      mode === 'admin'
        ? { email, password }
        : mode === 'child'
        ? { username, password: pin }
        : { username: 'viewer', password: pin }

    const res = await signIn('credentials', { ...credentials, redirect: false })
    setLoading(false)

    if (res?.error) {
      setError('Wrong credentials — try again.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center mb-1">🌞 SummerQuest</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Summer 2026</p>

        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden border border-amber-200 mb-6">
          {(['child', 'viewer', 'admin'] as LoginMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-amber-400 text-white'
                  : 'bg-white text-gray-500 hover:bg-amber-50'
              }`}
            >
              {m === 'child' ? 'Me' : m === 'viewer' ? 'Grandparents' : 'Admin'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {mode === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          {mode === 'child' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          {mode === 'viewer' && (
            <div>
              <label className="block text-sm font-medium mb-1">Family PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                placeholder="Enter the PIN"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Ask the family for the PIN.</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
