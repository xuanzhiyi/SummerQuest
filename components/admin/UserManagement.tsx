'use client'

import { useState } from 'react'

interface User { id: number; name: string; role: string }
interface Link { guardian_id: number; child_id: number }

interface Props {
  initialUsers: Record<string, unknown>[]
  initialLinks: Record<string, unknown>[]
}

export default function UserManagement({ initialUsers, initialLinks }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers as unknown as User[])
  const [links, setLinks] = useState<Link[]>(initialLinks as unknown as Link[])
  const [creating, setCreating] = useState<{ role: string } | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', pin: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const children  = users.filter(u => u.role === 'child')
  const guardians = users.filter(u => u.role === 'guardian')

  function linkedChildren(guardianId: number) {
    return links.filter(l => l.guardian_id === guardianId).map(l => users.find(u => u.id === l.child_id)).filter(Boolean) as User[]
  }
  function linkedGuardians(childId: number) {
    return links.filter(l => l.child_id === childId).map(l => users.find(u => u.id === l.guardian_id)).filter(Boolean) as User[]
  }
  function isLinked(guardianId: number, childId: number) {
    return links.some(l => l.guardian_id === guardianId && l.child_id === childId)
  }

  async function createUser() {
    if (!form.name || !form.pin || !creating) return
    setBusy(true); setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, role: creating.role, pin: form.pin }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error); return }
    setUsers(prev => [...prev, data.user])
    setCreating(null); setForm({ name: '', pin: '' })
  }

  async function updateUser() {
    if (!editing) return
    setBusy(true); setError('')
    const body: Record<string, unknown> = { id: editing.id, name: form.name }
    if (form.pin) body.pin = form.pin
    const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error); return }
    setUsers(prev => prev.map(u => u.id === editing.id ? data.user : u))
    setEditing(null); setForm({ name: '', pin: '' })
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u.id !== id))
    setLinks(prev => prev.filter(l => l.guardian_id !== id && l.child_id !== id))
  }

  async function toggleLink(guardianId: number, childId: number) {
    const action = isLinked(guardianId, childId) ? 'unlink' : 'link'
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, guardian_id: guardianId, child_id: childId }) })
    if (action === 'link') {
      setLinks(prev => [...prev, { guardian_id: guardianId, child_id: childId }])
    } else {
      setLinks(prev => prev.filter(l => !(l.guardian_id === guardianId && l.child_id === childId)))
    }
  }

  function startEdit(u: User) { setEditing(u); setForm({ name: u.name, pin: '' }); setCreating(null) }
  function startCreate(role: string) { setCreating({ role }); setForm({ name: '', pin: '' }); setEditing(null) }

  const modalOpen = creating || editing

  return (
    <div className="space-y-6">
      {/* Children */}
      <Section title="Kids / 孩子" icon="🧒">
        {children.map(u => (
          <UserRow key={u.id} user={u} badge={linkedGuardians(u.id).map(g => g.name).join(', ') || 'No guardian'} onEdit={() => startEdit(u)} onDelete={() => deleteUser(u.id)} />
        ))}
        <AddButton label="Add Kid" onClick={() => startCreate('child')} />
      </Section>

      {/* Guardians */}
      <Section title="Guardians / 监护人" icon="👴">
        {guardians.map(u => (
          <div key={u.id}>
            <UserRow user={u} badge={linkedChildren(u.id).map(c => c.name).join(', ') || 'No kids linked'} onEdit={() => startEdit(u)} onDelete={() => deleteUser(u.id)} />
            {/* Link toggles */}
            <div style={{ paddingLeft: 16, paddingBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {children.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleLink(u.id, c.id)}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    background: isLinked(u.id, c.id) ? '#D1FAE5' : '#F3F4F6',
                    color: isLinked(u.id, c.id) ? '#065F46' : '#6B7280',
                    border: `2px solid ${isLinked(u.id, c.id) ? '#6EE7B7' : '#E5E7EB'}`,
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {isLinked(u.id, c.id) ? '✓ ' : '+ '}{c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        <AddButton label="Add Guardian" onClick={() => startCreate('guardian')} />
      </Section>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 22, padding: 28, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 600, margin: '0 0 20px' }}>
              {creating ? `New ${creating.role}` : `Edit ${editing?.name}`}
            </h2>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ display: 'block', width: '100%', border: '2px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', fontSize: 15, fontFamily: "'Nunito', sans-serif", marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>
                  PIN (4 digits{editing ? ' — leave blank to keep current' : ''})
                </label>
                <input
                  type="password"
                  value={form.pin}
                  onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="••••"
                  style={{ display: 'block', width: '100%', border: '2px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', fontSize: 15, fontFamily: "'Nunito', sans-serif", marginTop: 4 }}
                />
              </div>
              {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={creating ? createUser : updateUser}
                  disabled={busy}
                  style={{ flex: 1, background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                >
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setCreating(null); setEditing(null) }}
                  style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
        {icon} {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function UserRow({ user, badge, onEdit, onDelete }: { user: User; badge: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{user.name}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{badge}</p>
      </div>
      <button onClick={onEdit} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 10, border: '2px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Edit</button>
      <button onClick={onDelete} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 10, border: '2px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Delete</button>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', marginTop: 10, border: '2px dashed #E5E7EB', background: '#F9FAFB', borderRadius: 14, padding: '12px', fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: '#9CA3AF', cursor: 'pointer' }}
    >
      + {label}
    </button>
  )
}
