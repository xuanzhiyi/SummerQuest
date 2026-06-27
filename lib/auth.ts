import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import sql from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        name: { label: 'Name', type: 'text' },
        pin:  { label: 'PIN',  type: 'password' },
      },
      async authorize(credentials) {
        const { name, pin } = credentials as { name?: string; pin?: string }
        if (!name || !pin) return null

        const [user] = await sql`
          SELECT id, name, role, pin_hash, password_hash
          FROM users WHERE LOWER(name) = LOWER(${name})
        `
        if (!user) return null

        // Try pin_hash first; fall back to password_hash for legacy accounts
        let valid = false
        if (user.pin_hash) {
          valid = await compare(pin, user.pin_hash as string)
        } else if (user.password_hash) {
          valid = await compare(pin, user.password_hash as string)
        }
        if (!valid) return null

        // Guardian: load linked child IDs into session
        let childIds: number[] = []
        if (user.role === 'guardian') {
          const rows = await sql`SELECT child_id FROM guardian_children WHERE guardian_id = ${user.id}`
          childIds = rows.map(r => Number(r.child_id))
        }

        return { id: String(user.id), name: String(user.name), role: String(user.role), childIds }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role     = (user as { role: string }).role
        token.id       = user.id
        token.childIds = (user as { childIds?: number[] }).childIds ?? []
      }
      return token
    },
    session({ session, token }) {
      session.user.role     = token.role as string
      session.user.id       = token.id as string
      session.user.childIds = (token.childIds as number[]) ?? []
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 90 * 24 * 60 * 60 },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: string
      childIds: number[]
    }
  }
}
