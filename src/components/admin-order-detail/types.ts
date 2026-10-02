import type { Dict } from "@/lib/i18n"

export type AdminCopy = Dict["admin"]
export type DetailCopy = AdminCopy["orderDetail"]

/** `page`: /admin/orders/[id], full width with a sticky action bar. `pane`: the 2xl split pane beside the queue. */
export type DetailVariant = "page" | "pane"
