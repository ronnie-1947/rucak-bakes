import Link from "next/link"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Tag } from "@/components/ui/Tag"
import type { EditorOrder } from "@/lib/calendar/day"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type DayOrderRowProps = {
  order: EditorOrder
  dict: AdminCopy
}

/**
 * One order for the day, opening it: the customer and code beside the status, every line ("1× Chocolate truffle cake ·
 * 12× Butter croissant"), then the pickup time and a red Allergen / orange Note tag when the customer wrote one.
 */
export function DayOrderRow({ order, dict }: DayOrderRowProps) {
  const o = dict.calendarDay.orders
  const lines = order.lines.map((line) => fill(o.line, { quantity: line.quantity, name: line.name })).join(" · ")
  return (
    <li>
      <Link
        href={order.href}
        className="flex flex-col gap-1 rounded-panel border border-border p-3 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{order.name}</span>
            <span className="text-small-admin text-muted tabular-nums">{order.code}</span>
          </span>
          <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
        </span>
        <span className="text-small-admin text-pretty tabular-nums">{lines}</span>
        {order.pickupTime || order.note ? (
          <span className="flex flex-wrap items-center gap-2 text-small-admin text-muted tabular-nums">
            {order.pickupTime ? <span>{fill(o.pickup, { time: order.pickupTime })}</span> : null}
            {order.note ? <Tag tone={order.note === "allergen" ? "red" : "warm"}>{order.note === "allergen" ? o.allergen : o.note}</Tag> : null}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
