import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAllProgress } from '@/lib/progress'
import NavBar from '@/components/ui/NavBar'
import ProgressView from '@/components/ProgressView'

export default async function ProgressPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Viewer reads child's progress — find child user id
  let userId: number
  if (session.user.role === 'viewer') {
    const sql = (await import('@/lib/db')).default
    const [child] = await sql`SELECT id FROM users WHERE role = 'child' LIMIT 1`
    if (!child) redirect('/')
    userId = child.id
  } else {
    userId = parseInt(session.user.id)
  }

  const progress = await getAllProgress(userId)

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role={session.user.role} name={session.user.name ?? ''} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <h2 className="text-xl font-bold mb-1">Quest Progress</h2>
        <p className="text-sm text-gray-500 mb-6">Points earned per track · Summer 2026</p>
        <ProgressView progress={progress} role={session.user.role} />
      </main>
    </div>
  )
}
