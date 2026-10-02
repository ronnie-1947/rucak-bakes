import NextAuth, { type DefaultSession } from "next-auth"
// Not a no-op: pulls next-auth/jwt into the program so the JWT augmentation below can resolve it.
import type {} from "next-auth/jwt"
import Google from "next-auth/providers/google"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import type { StaffRole } from "@/generated/prisma/client"
import { ADMIN_LOGIN } from "@/lib/admin-routes"
import { prisma } from "@/lib/db"

/**
 * Set by the sign-in action from "Keep me signed in on this device", read once when the token is minted.
 * "0" gives the session a hard end SHORT_SESSION_MS later instead of the default 30 days.
 */
export const KEEP_SIGNED_IN_COOKIE = "bakery.keep-signed-in"
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000

/**
 * TEMPORARY — `ADMIN_AUTH_BYPASS=1` switches the admin login off while the screens are built: the proxy
 * lets /admin/* through and requireStaff() acts as the first active owner, so actions still record a
 * real staff id. Refused on a Vercel production deploy. Delete the env line to restore the login.
 */
export const authBypassed = process.env.ADMIN_AUTH_BYPASS === "1" && process.env.VERCEL_ENV !== "production"

declare module "next-auth" {
  interface Session {
    user: { staffId: string; role: StaffRole } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string
    role?: StaffRole
    /** Epoch ms. Set only when the user unticked "Keep me signed in". */
    endsAt?: number
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
        // This runs inside the OAuth callback request, so the cookie the sign-in action set is readable.
        const jar = await cookies()
        if (jar.get(KEEP_SIGNED_IN_COOKIE)?.value === "0") token.endsAt = Date.now() + SHORT_SESSION_MS
        jar.delete(KEEP_SIGNED_IN_COOKIE)
      }
      // Null ends the session: Auth.js clears the cookie and the proxy sends the next navigation to login.
      if (token.endsAt && Date.now() > token.endsAt) return null
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
 * The signed-in staff member if the session is valid AND the staff row is still active — else null.
 * Cached per request, so the layout and a page can both ask without a second query.
 */
export const getStaff = cache(async () => {
  const select = { id: true, name: true, email: true, role: true, isActive: true } as const
  const session = await auth()
  const staffId = session?.user?.staffId
  if (!staffId) {
    if (!authBypassed) return null
    return prisma.staff.findFirst({ where: { isActive: true, role: "OWNER" }, orderBy: { createdAt: "asc" }, select })
  }
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select })
  return staff?.isActive ? staff : null
})

/**
 * The signed-in staff member, re-checked against the database. A JWT outlives a deactivation, so the
 * allowlist is consulted on every admin render and every server action — and proxy.ts guards pages,
 * not server actions. Call this first in every admin action.
 */
export async function requireStaff() {
  const staff = await getStaff()
  if (!staff) redirect(ADMIN_LOGIN)
  return staff
}
