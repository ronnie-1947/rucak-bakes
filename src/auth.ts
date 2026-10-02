import NextAuth, { type DefaultSession } from "next-auth"
// Not a no-op: pulls next-auth/jwt into the program so the JWT augmentation below can resolve it.
import type {} from "next-auth/jwt"
import Google from "next-auth/providers/google"
import { redirect } from "next/navigation"
import type { StaffRole } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"

declare module "next-auth" {
  interface Session {
    user: { staffId: string; role: StaffRole } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string
    role?: StaffRole
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    /** The entire security model: a verified Google email that is on the active `staff` allowlist. */
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase()
      if (!email || profile?.email_verified !== true) return false

      const staff = await prisma.staff.findUnique({ where: { email } })
      if (!staff || !staff.isActive) {
        // Not `false` (a bare AccessDenied): the login screen names the account Google used,
        // because being signed into a personal account is the most common cause.
        return `/admin/login?error=NotApproved&email=${encodeURIComponent(email)}`
      }

      await prisma.staff.update({
        where: { id: staff.id },
        data: { googleSub: profile.sub ?? null, lastLoginAt: new Date() },
      })
      return true
    },

    /** `profile` is only present on the sign-in request — that's when staff.id and role go on the token. */
    async jwt({ token, profile }) {
      if (profile?.email) {
        const staff = await prisma.staff.findUnique({
          where: { email: profile.email.toLowerCase() },
          select: { id: true, role: true },
        })
        if (staff) {
          token.staffId = staff.id
          token.role = staff.role
        }
      }
      return token
    },

    session({ session, token }) {
      if (token.staffId && token.role) {
        session.user.staffId = token.staffId
        session.user.role = token.role
      }
      return session
    },
  },
})

/**
 * The signed-in staff member, re-checked against the database. A JWT outlives a deactivation, so the
 * allowlist is consulted on every admin render and every server action — and proxy.ts guards pages,
 * not server actions. Call this first in every admin action.
 */
export async function requireStaff() {
  const session = await auth()
  const staffId = session?.user?.staffId
  const staff = staffId
    ? await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, name: true, email: true, role: true, isActive: true } })
    : null
  if (!staff?.isActive) redirect("/admin/login")
  return staff
}
