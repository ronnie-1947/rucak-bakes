import type { LoginState } from "@/components/admin-login/types"

/**
 * The login screen's state from its query string.
 *
 * `error` values (see src/auth.ts):
 *   NotApproved        ours — a verified Google email that isn't on the staff allowlist (`email` names it)
 *   AccessDenied       no verified email, or the allowlist lookup threw (database down)
 *   OAuthCallbackError the user backed out at Google's consent screen
 *   Configuration      a server-side or network fault talking to Google
 * `reason=expired` is the proxy's: a session cookie was present but no longer decodes.
 */
export function loginStateOf(error: string | undefined, reason: string | undefined): LoginState {
  switch (error) {
    case "NotApproved":
      return "rejected"
    case "OAuthCallbackError":
      return "cancelled"
    case "Configuration":
      return "network"
    case undefined:
      return reason === "expired" ? "expired" : "ready"
    default:
      return "failed"
  }
}

/** A search param as one string — repeated keys keep the first. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
