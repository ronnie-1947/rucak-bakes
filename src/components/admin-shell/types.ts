import type { Dict } from "@/lib/i18n"

export type AdminCopy = Dict["admin"]

/** What every part of the shell needs, read once in the admin layout. */
export type ShellData = {
  bakeryName: string
  /** Today in the bakery's timezone — "Fri 2 Oct". */
  todayLabel: string
  /** PENDING orders from today on — the Orders badge. */
  pendingCount: number
  staffName: string
  /** ADMIN_AUTH_BYPASS is on — the shell says so, so it is never forgotten. */
  bypassed: boolean
}
