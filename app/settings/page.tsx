import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import NavBar from '@/components/ui/NavBar'
import sql from '@/lib/db'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function GuardianSettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'child') redirect('/')
  if (session.user.role === 'admin') redirect('/admin/settings')

  const childId = session.user.childIds?.[0]
  if (!childId) redirect('/')

  const [child] = await sql`SELECT id, name, perfect_day_threshold FROM users WHERE id = ${childId}`
  if (!child) redirect('/')

  const [settings, thresholds] = await Promise.all([
    sql`SELECT * FROM track_settings WHERE child_user_id = ${childId} ORDER BY track`,
    sql`SELECT * FROM reward_thresholds ORDER BY track, points_required`,
  ])

  return (
    <div className="hud-page">
      <div className="hud-shell-wide">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={session.user.role} name={session.user.name ?? ''} />
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#12182A', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', marginBottom: 18 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7CEE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <p style={eyebrowStyle}>Settings</p>
          <h1 style={titleStyle}>Settings for {String(child.name)}</h1>
        </header>
        <main className="px-4 py-6">
          <SettingsForm
            settings={settings as unknown as Record<string, unknown>[]}
            thresholds={thresholds as unknown as Record<string, unknown>[]}
            childUserId={childId}
            perfectDayThreshold={child.perfect_day_threshold != null ? Number(child.perfect_day_threshold) : null}
          />
        </main>
      </div>
    </div>
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
