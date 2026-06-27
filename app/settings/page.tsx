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

  // Resolve child
  const childId = session.user.childIds?.[0]
  if (!childId) redirect('/')

  const [child] = await sql`SELECT id, name FROM users WHERE id = ${childId}`
  if (!child) redirect('/')

  const [settings, thresholds] = await Promise.all([
    sql`SELECT * FROM track_settings WHERE child_user_id = ${childId} ORDER BY track`,
    sql`SELECT * FROM reward_thresholds ORDER BY track, points_required`,
  ])

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
        <NavBar role={session.user.role} name={session.user.name ?? ''} />
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20, textDecoration: 'none', marginBottom: 10 }}
        >
          ←
        </Link>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0 }}>
          ⚙️ Settings for {String(child.name)}
        </h1>
      </header>
      <main className="px-4 py-6">
        <SettingsForm
          settings={settings as unknown as Record<string, unknown>[]}
          thresholds={thresholds as unknown as Record<string, unknown>[]}
          childUserId={childId}
        />
      </main>
    </div>
  )
}
