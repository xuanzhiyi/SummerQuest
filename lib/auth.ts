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
        familyCode: { label: 'Family', type: 'text' },
      },
      async authorize(credentials) {
        const { name, pin, familyCode } = credentials as { name?: string; pin?: string; familyCode?: string }
        if (!name || !pin || !familyCode) return null

        const [user] = await sql`
          SELECT users.id, users.name, users.role, users.pin_hash, users.password_hash, families.code AS family_code
          FROM users
          JOIN families ON families.id = users.family_id
          WHERE LOWER(users.name) = LOWER(${name})
            AND LOWER(families.code) = LOWER(${familyCode})
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

        return { id: String(user.id), name: String(user.name), role: String(user.role), familyCode: String(user.family_code), childIds }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role     = (user as { role: string }).role
        token.id       = user.id
        token.familyCode = (user as { familyCode?: string }).familyCode
        token.childIds = (user as { childIds?: number[] }).childIds ?? []
      }
      return token
    },
    session({ session, token }) {
      session.user.role     = token.role as string
      session.user.id       = token.id as string
      session.user.familyCode = token.familyCode as string
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
      familyCode: string
      childIds: number[]
    }
  }
}
