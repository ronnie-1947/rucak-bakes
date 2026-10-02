import type { Dict } from "@/lib/i18n"

/**
 * What the card shows above its buttons. All but `network` arrive from the URL (Auth.js redirects back
 * with `?error=`, the proxy adds `?reason=expired`); `network` is also raised in the browser when the
 * sign-in action itself can't reach the server.
 */
export type LoginState = "ready" | "rejected" | "cancelled" | "network" | "failed" | "expired"

export type LoginCopy = Dict["admin"]["login"]

/** The owner's number for the help dialog, both forms. Null when settings has no public phone. */
export type OwnerPhone = { e164: string; display: string } | null
