import type { ReactNode } from "react"
import type { OrdersCopy } from "./types"

type OrderTableProps = {
  dict: OrdersCopy
  paneOpen: boolean
  /** OrderTableGroup elements — a <tbody> per day. */
  children: ReactNode
}

type Pane = "open" | "closed"

/** Every column, for the day rows' colSpan. */
export const TABLE_COLUMNS = 9

const wide: Record<Pane, string> = { open: "2xl:hidden", closed: "" }

/** Under the 82px filter bar (OrdersFilterBar); with the 2xl pane open the bar no longer sticks, so the top. */
const tops: Record<Pane, string> = { open: "top-20.5 2xl:top-0", closed: "top-20.5" }

/** With the pane open, Status is the last column showing at 2xl — it takes the right edge. */
const statusEdges: Record<Pane, string> = { open: "2xl:rounded-tr-panel 2xl:border-r", closed: "" }

/**
 * From 1024px: one table for every day, its header row sticky under the filter bar and each day's row sticky under that.
 * Separate borders (not collapsed) so the header can round its top corners without an overflow-hidden wrapper, which would
 * stop anything inside from sticking. Columns size by the header's width classes.
 */
export function OrderTable({ dict, paneOpen, children }: OrderTableProps) {
  const t = dict.table
  const pane: Pane = paneOpen ? "open" : "closed"
  const head = `sticky z-10 border-y border-border bg-sunken px-2 text-left text-micro font-semibold whitespace-nowrap text-muted uppercase ${tops[pane]}`

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 tabular-nums">
      <thead>
        <tr className="h-10">
          <th scope="col" className={`w-36 rounded-tl-panel border-l pl-3 ${head}`}>
            {t.code}
          </th>
          <th scope="col" className={`w-16 ${head}`}>
            {t.time}
          </th>
          <th scope="col" className={head}>
            {t.customer}
          </th>
          <th scope="col" className={`w-32 ${head} ${wide[pane]}`}>
            {t.phone}
          </th>
          <th scope="col" className={`${head} ${wide[pane]}`}>
            {t.items}
          </th>
          <th scope="col" className={`w-20 text-right ${head}`}>
            {t.total}
          </th>
          <th scope="col" className={`w-36 ${head} ${wide[pane]}`}>
            {t.badges}
          </th>
          <th scope="col" className={`w-28 ${head} ${statusEdges[pane]}`}>
            {t.status}
          </th>
          <th scope="col" className={`w-44 rounded-tr-panel border-r pr-3 ${head} ${wide[pane]}`}>
            <span className="sr-only">{t.actions}</span>
          </th>
        </tr>
      </thead>
      {children}
    </table>
  )
}
