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
    <div className="min-h-screen flex flex-col">
      <NavBar role={session.user.role} name={session.user.name ?? ''} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <h2 className="text-xl font-bold mb-1">Settings</h2>
        <p className="text-sm text-gray-500 mb-6">
          Adjust difficulty levels, points per track, and reward thresholds.
        </p>
        <SettingsForm
          settings={settings as unknown as Record<string, unknown>[]}
          thresholds={thresholds as unknown as Record<string, unknown>[]}
        />
      </main>
    </div>
  )
}
