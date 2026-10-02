import type { IconName } from "@/components/ui/icons/Icon"
import type { AdminSection } from "@/lib/admin-routes"

export type NavKey = AdminSection | "more"

export type NavEntry = {
  key: NavKey
  href: string
  icon: IconName
  /** Path prefixes that light this entry up. "More" also owns the screens it lists. */
  match: string[]
}

const entry = (key: NavKey, icon: IconName, match?: string[]): NavEntry => ({
  key,
  href: `/admin/${key}`,
  icon,
  match: match ?? [`/admin/${key}`],
})

/** Under 768px: the five-tab bottom bar. Customers and Settings live behind More. */
export const tabNav: NavEntry[] = [
  entry("orders", "orders"),
  entry("daysheet", "daysheet"),
  entry("calendar", "calendar"),
  entry("menu", "menu"),
  entry("more", "more", ["/admin/more", "/admin/customers", "/admin/settings"]),
]

/** From 768px: the sidebar lists every screen. */
export const sidebarNav: NavEntry[] = [
  entry("orders", "orders"),
  entry("daysheet", "daysheet"),
  entry("calendar", "calendar"),
  entry("menu", "menu"),
  entry("customers", "customers"),
  entry("settings", "settings"),
]

/** The resting look of a sidebar row — shared by NavLink and the sign-out button so they line up. */
export const sidebarRow = "relative flex min-h-11 w-full items-center gap-3 rounded-chip px-3 text-left"
