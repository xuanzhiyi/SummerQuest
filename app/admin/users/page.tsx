import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import NavBar from '@/components/ui/NavBar'
import UserManagement from '@/components/admin/UserManagement'
import sql from '@/lib/db'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const users = await sql`SELECT id, name, role FROM users ORDER BY role, name`
  const links = await sql`SELECT guardian_id, child_id FROM guardian_children`

  return (
    <div className="hud-page">
      <div className="hud-shell-wide">
        <header style={{ padding: '44px 20px 24px' }}>
          <NavBar role={session.user.role} name={session.user.name ?? ''} />
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>Users</h1>
        </header>
        <main className="px-4 py-6">
          <UserManagement
            initialUsers={users as unknown as Record<string, unknown>[]}
            initialLinks={links as unknown as Record<string, unknown>[]}
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
