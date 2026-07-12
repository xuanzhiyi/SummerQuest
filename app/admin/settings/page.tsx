import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import NavBar from '@/components/ui/NavBar'
import SystemSettingsForm from '@/components/admin/SystemSettingsForm'

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const rows = await sql`SELECT key, value FROM system_settings`
  const systemSettings: Record<string, string> = {}
  for (const r of rows) systemSettings[r.key as string] = r.value as string

  return (
    <div className="hud-page">
      <div className="hud-shell-wide">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={session.user.role} name={session.user.name ?? ''} />
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>System Settings</h1>
        </header>
        <main className="px-4 py-6">
          <SystemSettingsForm settings={systemSettings} />
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
