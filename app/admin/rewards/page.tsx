import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import NavBar from '@/components/ui/NavBar'
import RewardsQueue from '@/components/admin/RewardsQueue'

export default async function AdminRewardsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const pending = await sql`
    SELECT rt.*, ts_label.track AS track_label
    FROM reward_thresholds rt
    LEFT JOIN track_settings ts_label ON ts_label.track = rt.track
    WHERE rt.requested_at IS NOT NULL AND rt.fulfilled_at IS NULL AND rt.dismissed_at IS NULL
    ORDER BY rt.requested_at ASC
  `

  const recent = await sql`
    SELECT * FROM reward_thresholds
    WHERE fulfilled_at IS NOT NULL OR dismissed_at IS NOT NULL
    ORDER BY COALESCE(fulfilled_at, dismissed_at) DESC
    LIMIT 20
  `

  return (
    <div className="hud-page">
      <div className="hud-shell-wide">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={session.user.role} name={session.user.name ?? ''} />
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>Reward Requests</h1>
        </header>
        <main className="px-4 py-6">
          <RewardsQueue
            pending={pending as unknown as Record<string, unknown>[]}
            recent={recent as unknown as Record<string, unknown>[]}
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
