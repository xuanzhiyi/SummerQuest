import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getAllProgress } from '@/lib/progress'
import NavBar from '@/components/ui/NavBar'
import ProgressView from '@/components/ProgressView'

export default async function ProgressPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let userId: number
  if (session.user.role === 'guardian') {
    const childId = session.user.childIds?.[0]
    if (!childId) redirect('/')
    userId = childId
  } else {
    userId = parseInt(session.user.id)
  }

  const progress = await getAllProgress(userId)

  return (
    <div className="hud-page">
      <div className="hud-shell-wide">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={session.user.role} name={session.user.name ?? ''} />
          <BackLink href="/" />
          <p style={eyebrowStyle}>Summer 2026</p>
          <h1 style={titleStyle}>Quest Progress</h1>
          <p style={{ fontSize: 13, color: '#6B7793', fontWeight: 600, marginTop: 4 }}>Points earned per track</p>
        </header>
        <main className="px-4 py-6">
          <ProgressView progress={progress} role={session.user.role} />
        </main>
      </div>
    </div>
  )
}

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#12182A', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', marginBottom: 18 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  )
}

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#4A5470',
  textTransform: 'uppercase',
  letterSpacing: 2,
  margin: '0 0 8px',
} as const

const titleStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 28,
  fontWeight: 700,
  color: '#fff',
  margin: 0,
} as const
