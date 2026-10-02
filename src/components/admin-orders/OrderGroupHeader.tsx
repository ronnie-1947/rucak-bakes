import type { OrderGroupData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type OrderGroupHeaderProps = {
  group: OrderGroupData
  dict: OrdersCopy
}

const counters: Record<"open" | "full", string> = {
  open: "text-muted",
  full: "text-red",
}

/** "Today · Fri 2 Oct — 9 orders" … "3/10 verified" (red at capacity). */
export function OrderGroupHeader({ group, dict }: OrderGroupHeaderProps) {
  const day = fill(dict.groupDay[group.relative ?? "other"], { date: group.dayLabel })
  const count = group.orders.length
  const full = group.maxOrders !== null && group.verifiedCount >= group.maxOrders
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <h2 className="font-sans text-small-admin font-semibold">{count === 1 ? fill(dict.groupTitleOne, { day }) : fill(dict.groupTitle, { day, count })}</h2>
      {group.maxOrders !== null ? (
        <span className={`text-small-admin font-semibold whitespace-nowrap ${counters[full ? "full" : "open"]}`}>
          {fill(dict.groupCounter, { verified: group.verifiedCount, max: group.maxOrders })}
        </span>
      ) : null}
    </div>
  )
}
