'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  role: string
  name: string
}

export default function NavBar({ role, name }: Props) {
  return (
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
  )
}
