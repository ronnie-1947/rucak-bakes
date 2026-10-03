import Link from "next/link"
import { ItemsLine } from "@/components/ui/ItemsLine"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Tag } from "@/components/ui/Tag"
import type { CustomerOrder } from "@/lib/customers/detail"
import { formatPaise } from "@/lib/money"
import type { AdminCopy } from "./types"

type HistoryRowProps = {
  order: CustomerOrder
  /** Pending, verified or ready — framed with the warm edge and tagged Active. */
  live: boolean
  dict: AdminCopy
}

const frames: Record<"live" | "past", string> = {
  live: "rounded-panel border border-border border-l-4 border-l-o500 px-3",
  past: "border-b border-border",
}

/** One order in a customer's history: the day, its code (to the order) and lines, the total and where it stands. */
export function HistoryRow({ order, live, dict }: HistoryRowProps) {
  return (
    <li className={`grid min-h-16 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 py-2 lg:grid-cols-[5rem_minmax(0,1fr)_auto] ${frames[live ? "live" : "past"]}`}>
      <span className="flex flex-col text-small-admin tabular-nums">
        <span className="font-semibold">{order.weekdayLabel}</span>
        <span className="text-muted">{order.dateLabel}</span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2">
          <Link href={`/admin/orders/${order.id}`} className="text-small-admin text-muted tabular-nums hover:text-o700 hover:underline">
            {order.code}
          </Link>
          {live ? <Tag tone="accent">{dict.customerDetail.history.active}</Tag> : null}
        </span>
        <ItemsLine lines={order.lines} dict={dict.orders} />
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="font-semibold text-o700 tabular-nums">{formatPaise(order.totalPaise)}</span>
        <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
      </span>
    </li>
  )
}
