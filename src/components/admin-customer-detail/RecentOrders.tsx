import Link from "next/link"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { HistoryRow } from "./HistoryRow"
import type { AdminCopy } from "./types"

type RecentOrdersProps = {
  customer: Pick<CustomerDetailData, "id" | "live" | "past">
  dict: AdminCopy
}

const RECENT = 5

/** The pane's short history: open orders, then the latest few — and the way to the full record. */
export function RecentOrders({ customer, dict }: RecentOrdersProps) {
  const d = dict.customerDetail
  const past = customer.past.slice(0, Math.max(0, RECENT - customer.live.length))
  return (
    <section aria-labelledby="recent-title" className="flex flex-col rounded-panel border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3">
        <h3 id="recent-title" className="font-sans text-micro font-semibold text-muted uppercase">
          {d.history.recent}
        </h3>
        <Link href={`/admin/customers/${customer.id}`} className="flex min-h-11 items-center text-small-admin font-semibold text-o700 hover:underline">
          {d.openFull}
        </Link>
      </div>
      {customer.live.length + customer.past.length === 0 ? <p className="p-3 text-muted">{d.history.none}</p> : null}
      <ul className="flex flex-col gap-2 px-3 py-2">
        {customer.live.map((order) => (
          <HistoryRow key={order.id} order={order} live dict={dict} />
        ))}
        {past.map((order) => (
          <HistoryRow key={order.id} order={order} live={false} dict={dict} />
        ))}
      </ul>
    </section>
  )
}
