'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  backHref?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  role?: string
  name?: string
  children?: React.ReactNode
}

export default function NavHeader({ backHref, eyebrow, title, subtitle, role, name, children }: Props) {
  return (
    <header style={{ background: '#0B1F3A', padding: '50px 20px 22px', position: 'relative' }}>
      {/* Admin links + sign out strip */}
      <div className="flex justify-between items-center mb-2" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
        <div className="flex gap-3">
          {role === 'admin' && (
            <>
              <Link href="/admin/settings" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>
                Settings
              </Link>
              <Link href="/admin/rewards" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>
                Rewards
              </Link>
            </>
          )}
          {role && (
            <Link href="/progress" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>
              Progress
            </Link>
          )}
        </div>
        {name && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >
            {name} · Sign out
          </button>
        )}
      </div>

      {/* Back button */}
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 11,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 20, textDecoration: 'none',
            marginBottom: 10,
          }}
        >
          ←
        </Link>
      )}

      {/* Eyebrow label */}
      {eyebrow && (
        <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
          {eyebrow}
        </p>
      )}

      {/* Title */}
      {title && (
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.1 }}>
          {title}
        </h1>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>
          {subtitle}
        </p>
      )}

      {children}
    </header>
  )
}
