import type { CustomerOrder } from "@/lib/customers/detail"
import { fill } from "@/lib/template"
import { HistoryRow } from "./HistoryRow"
import type { AdminCopy } from "./types"

type MonthGroupProps = {
  /** "2026-10" */
  month: string
  orders: CustomerOrder[]
  /** All of the month's orders, shown or not — the header's count. */
  count: number
  dict: AdminCopy
}

const monthLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" })

/** "OCTOBER 2026 · 4 orders" — a sticky header over the month's orders. */
export function MonthGroup({ month, orders, count, dict }: MonthGroupProps) {
  const h = dict.customerDetail.history
  const label = monthLabel.format(new Date(`${month}-01T00:00:00Z`))
  return (
    <section aria-label={label} className="flex flex-col">
      <h3 className="sticky top-0 z-10 flex h-9 items-center justify-between border-b border-border bg-background font-sans">
        <span className="text-micro font-semibold text-muted uppercase">{label}</span>
        <span className="text-micro font-normal text-muted tabular-nums">{count === 1 ? h.monthCountOne : fill(h.monthCount, { count })}</span>
      </h3>
      <ul className="flex flex-col">
        {orders.map((order) => (
          <HistoryRow key={order.id} order={order} live={false} dict={dict} />
        ))}
      </ul>
    </section>
  )
}
