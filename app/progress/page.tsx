import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getAllProgress } from '@/lib/progress'
import NavBar from '@/components/ui/NavBar'
import ProgressView from '@/components/ProgressView'

export default async function ProgressPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Guardian reads their first linked child's progress
  let userId: number
  if (session.user.role === 'guardian') {
    const childId = session.user.childIds?.[0]
    if (!childId) redirect('/')
    userId = childId
  } else {
    userId = parseInt(session.user.id)
  }

  const progress = await getAllProgress(userId)

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      <header style={{ background: '#0B1F3A', padding: '50px 20px 22px' }}>
        <NavBar role={session.user.role} name={session.user.name ?? ''} />
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20, textDecoration: 'none', marginBottom: 10 }}>←</Link>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0 }}>
          📊 Quest Progress
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>Points earned per track · Summer 2026</p>
      </header>
      <main className="px-4 py-6">
        <ProgressView progress={progress} role={session.user.role} />
      </main>
    </div>
  )
}
