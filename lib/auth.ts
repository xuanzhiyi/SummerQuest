import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import sql from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        // admin uses email + password
        // child uses username + pin
        // viewer uses pin only (username = 'viewer')
        username: { label: 'Username', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password / PIN', type: 'password' },
      },
      async authorize(credentials) {
        const { username, email, password } = credentials as {
          username?: string
          email?: string
          password?: string
        }

        if (!password) return null

        // Admin login: email + password
        if (email) {
          const [user] = await sql`
            SELECT id, name, role, email, password_hash
            FROM users
            WHERE email = ${email} AND role = 'admin'
          `
          if (!user || !user.password_hash) return null
          const valid = await compare(password, user.password_hash)
          if (!valid) return null
          return { id: String(user.id), name: user.name, role: user.role, email: user.email }
        }

        // Child login: username + PIN
        if (username && username !== 'viewer') {
          const [user] = await sql`
            SELECT id, name, role, username, pin_hash
            FROM users
            WHERE username = ${username} AND role = 'child'
          `
          if (!user || !user.pin_hash) return null
          const valid = await compare(password, user.pin_hash)
          if (!valid) return null
          return { id: String(user.id), name: user.name, role: user.role }
        }

        // Viewer login: PIN only
        if (username === 'viewer' || (!email && !username)) {
          const [user] = await sql`
            SELECT id, name, role, pin_hash
            FROM users
            WHERE role = 'viewer'
          `
          if (!user || !user.pin_hash) return null
          const valid = await compare(password, user.pin_hash)
          if (!valid) return null
          return { id: String(user.id), name: user.name, role: user.role }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Long-lived session for viewer (grandparents) — 90 days
    maxAge: 90 * 24 * 60 * 60,
  },
})

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: string
    }
  }
}
