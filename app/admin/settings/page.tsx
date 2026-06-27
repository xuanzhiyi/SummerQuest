import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import NavBar from '@/components/ui/NavBar'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const [settings, thresholds] = await Promise.all([
    sql`SELECT * FROM track_settings ORDER BY track`,
    sql`SELECT * FROM reward_thresholds ORDER BY track, points_required`,
  ])

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
        <NavBar role={session.user.role} name={session.user.name ?? ''} />
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0 }}>
          ⚙️ Settings
        </h1>
      </header>
      <main className="px-4 py-6">
        <SettingsForm
          settings={settings as unknown as Record<string, unknown>[]}
          thresholds={thresholds as unknown as Record<string, unknown>[]}
        />
      </main>
    </div>
  )
}
