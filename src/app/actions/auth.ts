"use server"

import { cookies } from "next/headers"
import { KEEP_SIGNED_IN_COOKIE, signIn, signOut } from "@/auth"
import { ADMIN_LOGIN, safeAdminPath } from "@/lib/admin-routes"

/**
 * The login form's action. Redirects to Google — on success Auth.js brings the user back to
 * `callbackUrl`; on refusal, to the login screen with an `error` the screen maps to a state.
 *
 * Form fields: `callbackUrl` (the destination the proxy preserved), `keep` (checkbox), and `chooser`
 * — sent by "Try a different account", it forces Google's account picker, because the most common
 * rejection is a browser already signed into a personal account.
 */
export async function signInWithGoogle(formData: FormData) {
  const redirectTo = safeAdminPath(formData.get("callbackUrl"))
  const keep = formData.get("keep") === "on"

  const jar = await cookies()
  jar.set(KEEP_SIGNED_IN_COOKIE, keep ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  })

  const authorization = formData.get("chooser") === "1" ? { prompt: "select_account" } : undefined
  await signIn("google", { redirectTo }, authorization)
}

/** No requireStaff(): signing out must work even for a session whose staff row was deactivated. */
export async function signOutStaff() {
  await signOut({ redirectTo: ADMIN_LOGIN })
}
