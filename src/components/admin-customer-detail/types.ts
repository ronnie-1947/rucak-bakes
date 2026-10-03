import type { Dict } from "@/lib/i18n"

export type AdminCopy = Dict["admin"]
export type DetailCopy = AdminCopy["customerDetail"]

/** `page`: /admin/customers/[id]. `pane`: beside the list from 1600px — the summary, with a way to the full record. */
export type DetailVariant = "page" | "pane"
