import { NextResponse } from "next/server"
import { auth, authBypassed } from "@/auth"

/**
 * Keeps signed-out visitors off /admin/* (except the login screen) and remembers where they were
 * going, for the redirect after sign-in. An optimistic check only: the admin layout and every server
 * action re-check the session against the staff table.
 */
export default auth((request) => {
  const { pathname, search } = request.nextUrl
  if (authBypassed || pathname === "/admin/login" || request.auth?.user?.staffId) return NextResponse.next()

  const login = new URL("/admin/login", request.nextUrl.origin)
  login.searchParams.set("callbackUrl", `${pathname}${search}`)
  // A session cookie that no longer decodes means a session lapsed — rather than never existed.
  if (request.cookies.getAll().some((cookie) => cookie.name.includes("authjs.session-token"))) {
    login.searchParams.set("reason", "expired")
  }
  return NextResponse.redirect(login)
})

export const config = {
  matcher: ["/admin/:path*"],
}
