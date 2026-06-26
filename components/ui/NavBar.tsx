'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  role: string
  name: string
}

export default function NavBar({ role, name }: Props) {
  return (
    <header className="bg-white border-b border-amber-100 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold text-amber-600">
        🌞 SummerQuest
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        {role === 'admin' && (
          <>
            <Link href="/admin/settings" className="text-gray-500 hover:text-gray-800">
              Settings
            </Link>
            <Link href="/admin/rewards" className="text-gray-500 hover:text-gray-800">
              Rewards
            </Link>
          </>
        )}
        {(role === 'child' || role === 'admin') && (
          <Link href="/progress" className="text-gray-500 hover:text-gray-800">
            Progress
          </Link>
        )}
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">{name}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-gray-400 hover:text-gray-700"
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
