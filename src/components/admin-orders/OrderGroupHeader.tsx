import type { OrderGroupData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type Variant = "cards" | "table"

type OrderGroupHeaderProps = {
  group: Pick<OrderGroupData, "relative" | "dayLabel" | "orders" | "verifiedCount" | "maxOrders">
  dict: OrdersCopy
  /** `cards`: a sticky band of its own, under the filter bar. `table`: the content of the table's sticky day row. */
  variant: Variant
}

const counters: Record<"open" | "full", string> = {
  open: "text-muted",
  full: "text-red",
}

/** The cards' band bleeds into the page gutters so cards scroll out of sight beneath it. */
const frames: Record<Variant, string> = {
  cards: "sticky top-20.5 z-5 -mx-4 flex items-center justify-between gap-3 bg-background px-4 py-2 md:-mx-6 md:px-6",
  table: "flex items-center justify-between gap-3",
}

/** "Today · Fri 2 Oct — 9 orders" … "3/10 verified" (red at capacity). */
export function OrderGroupHeader({ group, dict, variant }: OrderGroupHeaderProps) {
  const day = fill(dict.groupDay[group.relative ?? "other"], { date: group.dayLabel })
  const count = group.orders.length
  const full = group.maxOrders !== null && group.verifiedCount >= group.maxOrders
  // A table header cell can't hold a heading — the day row is a <th scope="colgroup"> already.
  const Title = variant === "cards" ? "h2" : "span"
  return (
    <div className={frames[variant]}>
      <Title className="font-sans text-small-admin font-semibold tabular-nums">
        {count === 1 ? fill(dict.groupTitleOne, { day }) : fill(dict.groupTitle, { day, count })}
      </Title>
      {group.maxOrders !== null ? (
        <span className={`text-small-admin font-semibold whitespace-nowrap tabular-nums ${counters[full ? "full" : "open"]}`}>
          {fill(dict.groupCounter, { verified: group.verifiedCount, max: group.maxOrders })}
        </span>
      ) : null}
    </div>
  )
}
