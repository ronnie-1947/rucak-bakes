import type { Dict } from "@/lib/i18n"
import type { OrderRowData } from "@/lib/orders/queries"

export type AdminCopy = Dict["admin"]
export type OrdersCopy = AdminCopy["orders"]

/** Hrefs for one order — the full page below 2xl, the split pane from 2xl. Built on the server. */
export type OrderLinks = { page: string; pane: string }

export type BoardOrder = OrderRowData & { links: OrderLinks }
