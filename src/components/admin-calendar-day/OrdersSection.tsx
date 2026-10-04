import Link from "next/link"
import { Meter } from "@/components/ui/Meter"
import type { DayEditorData } from "@/lib/calendar/day"
import { formatWeekday } from "@/lib/dates"
import { fill } from "@/lib/template"
import { DayOrderRow } from "./DayOrderRow"
import type { AdminCopy } from "./types"

type OrdersSectionProps = {
  data: DayEditorData
  /** The max being edited — the meter and "6 of 10 orders taken" follow it. */
  maxOrders: number
  dict: AdminCopy
}

const takens: Record<"full" | "room", string> = {
  full: "font-semibold text-red",
  room: "text-muted",
}

/**
 * "Orders for this day" (§10R): what's booked — the count by status, a meter against max, then each order, opening it.
 * "Add order" takes a phone order for this date (7R.5) while the date is in the booking window.
 * Stays fully visible on a closed day: closing never touches the orders already placed.
 */
export function OrdersSection({ data, maxOrders, dict }: OrdersSectionProps) {
  const o = dict.calendarDay.orders
  const count = data.orders.length
  const full = count >= maxOrders
  const ordersText = count === 1 ? o.countOne : fill(o.count, { count })

  return (
    <section aria-labelledby="orders-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="orders-title" className="text-h2">
          {o.title}
        </h2>
        <span className="flex items-center gap-4">
          {data.addOrderHref ? (
            <Link href={data.addOrderHref} className="flex min-h-11 items-center text-small-admin font-semibold text-o700 hover:underline">
              {o.add}
            </Link>
          ) : null}
          <Link href={data.ordersHref} className="flex min-h-11 items-center text-small-admin font-semibold text-o700 hover:underline">
            {o.open}
          </Link>
        </span>
      </div>
      {count === 0 ? (
        <p className="rounded-panel bg-sunken p-4 text-center text-small-admin text-muted">{fill(o.none, { day: formatWeekday(data.date) })}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="font-semibold tabular-nums">
              {fill(o.summary, { orders: ordersText, verified: data.verified, pending: data.pending })}
            </span>
            <Meter value={count} max={maxOrders} tone={full ? "full" : "warm"} label={fill(o.taken, { count, max: maxOrders })} />
            <span className={`text-small-admin tabular-nums ${takens[full ? "full" : "room"]}`}>
              {fill(full ? o.takenFull : o.taken, { count, max: maxOrders })}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {data.orders.map((order) => (
              <DayOrderRow key={order.id} order={order} dict={dict} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
