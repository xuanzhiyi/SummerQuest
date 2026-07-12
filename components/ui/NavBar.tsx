'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  role: string
  name: string
}

export default function NavBar({ role, name }: Props) {
  return (
    <div className="flex justify-between items-center" style={{ marginBottom: 22, fontSize: 11 }}>
      <div className="flex gap-4">
        {role === 'admin' && (
          <>
            <Link href="/admin/users" style={linkStyle}>Users</Link>
            <Link href="/admin/settings" style={linkStyle}>System</Link>
            <Link href="/admin/rewards" style={linkStyle}>Rewards</Link>
          </>
        )}
        {role === 'guardian' && <Link href="/settings" style={linkStyle}>Settings</Link>}
        <Link href="/progress" style={linkStyle}>Progress</Link>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        style={{ background: 'none', border: 'none', color: '#6B7793', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}
      >
        {name} · Sign out
      </button>
    </div>
  )
}

const linkStyle = {
  color: '#6B7793',
  textDecoration: 'none',
  fontWeight: 700,
  letterSpacing: 0.3,
}
