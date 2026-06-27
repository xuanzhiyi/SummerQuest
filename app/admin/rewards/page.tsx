import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import NavBar from '@/components/ui/NavBar'
import RewardsQueue from '@/components/admin/RewardsQueue'

export default async function AdminRewardsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  // All pending (requested but not yet actioned) + recent fulfilled
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
    <div className="min-h-screen max-w-2xl mx-auto">
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
        <NavBar role={session.user.role} name={session.user.name ?? ''} />
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0 }}>
          🎁 Reward Requests
        </h1>
      </header>
      <main className="px-4 py-6">
        <RewardsQueue
          pending={pending as unknown as Record<string, unknown>[]}
          recent={recent as unknown as Record<string, unknown>[]}
        />
      </main>
    </div>
  )
}
