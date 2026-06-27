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
    <div className="min-h-screen max-w-2xl mx-auto">
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
        <NavBar role={session.user.role} name={session.user.name ?? ''} />
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0 }}>
          👥 Users
        </h1>
      </header>
      <main className="px-4 py-6">
        <UserManagement
          initialUsers={users as unknown as Record<string, unknown>[]}
          initialLinks={links as unknown as Record<string, unknown>[]}
        />
      </main>
    </div>
  )
}
