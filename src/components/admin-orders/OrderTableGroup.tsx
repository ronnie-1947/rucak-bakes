import type { ReactNode } from "react"
import type { OrderGroupData } from "@/lib/orders/queries"
import { OrderGroupHeader } from "./OrderGroupHeader"
import { TABLE_COLUMNS } from "./OrderTable"
import type { OrdersCopy } from "./types"

type OrderTableGroupProps = {
  group: Pick<OrderGroupData, "relative" | "dayLabel" | "orders" | "verifiedCount" | "maxOrders">
  dict: OrdersCopy
  paneOpen: boolean
  /** OrderTableRow elements. */
  children: ReactNode
}

/** Under the filter bar (82px) and the table's header row (40px); with the 2xl pane open, under the header row alone. */
const tops: Record<"open" | "closed", string> = { open: "top-30.5 2xl:top-10", closed: "top-30.5" }

/** One day of the table: its sticky "Today · Sat 3 Oct — 9 orders · 6/10 verified" row, then its orders. */
export function OrderTableGroup({ group, dict, paneOpen, children }: OrderTableGroupProps) {
  return (
    <tbody>
      <tr>
        <th
          scope="colgroup"
          colSpan={TABLE_COLUMNS}
          className={`sticky z-5 h-9 border-x border-b border-border bg-background px-3 text-left font-normal ${tops[paneOpen ? "open" : "closed"]}`}
        >
          <OrderGroupHeader group={group} dict={dict} variant="table" />
        </th>
      </tr>
      {children}
    </tbody>
  )
}
