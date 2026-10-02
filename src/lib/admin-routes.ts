/** Where a signed-in staff member lands when nothing else was asked for. */
export const ADMIN_HOME = "/admin/orders"

export const ADMIN_LOGIN = "/admin/login"

/** Top-level admin screens. Each is a key of `dict.admin.nav` and the first segment after /admin. */
export const adminSections = ["orders", "daysheet", "calendar", "menu", "customers", "settings"] as const

export type AdminSection = (typeof adminSections)[number]

function isAdminSection(value: string): value is AdminSection {
  return (adminSections as readonly string[]).includes(value)
}

/** "/admin/orders/abc?x=1" → "orders". Null for the login screen and anything unknown. */
export function adminSectionOf(path: string): AdminSection | null {
  const segment = path.split(/[?#]/)[0].split("/")[2] ?? ""
  return isAdminSection(segment) ? segment : null
}

/**
 * A post-login destination that is safe to redirect to: a same-origin path under /admin, never the
 * login screen itself. Anything else — an absolute URL, "//evil.example", a backslash trick — falls
 * back to ADMIN_HOME.
 */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return ADMIN_HOME
  if (!/^\/admin(?:[/?#]|$)/.test(value) || value.includes("//") || value.includes("\\")) return ADMIN_HOME
  if (value === ADMIN_LOGIN || value.startsWith(`${ADMIN_LOGIN}?`) || value.startsWith(`${ADMIN_LOGIN}/`)) return ADMIN_HOME
  return value
}
