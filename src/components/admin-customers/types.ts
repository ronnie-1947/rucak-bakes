import type { CustomerRow } from "@/lib/customers/queries"
import type { Dict } from "@/lib/i18n"

export type AdminCopy = Dict["admin"]
export type CustomersCopy = AdminCopy["customers"]

/** A row plus where it opens: the record's page, or (from 1600px) the split pane beside the list. */
export type BoardCustomer = CustomerRow & { links: { page: string; pane: string }; current: boolean }
