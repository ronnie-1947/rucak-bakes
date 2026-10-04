import Link from "next/link"
import { Meter } from "@/components/ui/Meter"
import type { WeekDay } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import { mainItemText } from "./copy"
import type { CalendarCopy } from "./types"

type DayOrdersProps = {
  day: WeekDay
  /** The card's live max — the meter follows the stepper as it moves. */
  maxOrders: number
  dict: CalendarCopy
}

type Fill = "full" | "green" | "warm"

const counters: Record<Fill, string> = {
  full: "font-semibold text-red",
  green: "text-muted",
  warm: "text-muted",
}

const dots: Record<"verified" | "pending", string> = {
  verified: "bg-green",
  pending: "bg-o500",
}

/** How many orders a card names before "+ 3 more". */
const SHOWN = 3

/** Full at max; green from 70% (a good day); the warm fill below that. */
function fillOf(orders: number, max: number): Fill {
  if (orders >= max) return "full"
  return orders / max >= 0.7 ? "green" : "warm"
}

/**
 * A day's orders on its card: "4 / 10" and the meter, "3 verified · 1 pending" (red " · full" at max), then up to three
 * orders — a status dot, the customer and their biggest line — as one link into the day ("+ 3 more" below them).
 */
export function DayOrders({ day, maxOrders, dict }: DayOrdersProps) {
  const orders = day.liveOrders.length
  const tone = fillOf(orders, maxOrders)
  const dayName = `${day.weekdayName} ${day.dateLabel}`
  const open = orders === 1 ? fill(dict.ordersOpenOne, { day: day.weekdayName }) : fill(dict.ordersOpen, { day: day.weekdayName, count: orders })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-small-admin font-semibold">{dict.orders}</span>
        <span className="text-small-admin font-semibold tabular-nums">{fill(dict.ordersTaken, { orders, max: maxOrders })}</span>
      </div>
      <Meter value={orders} max={maxOrders} tone={tone} label={fill(dict.meterLabel, { day: dayName, orders, max: maxOrders })} />
      {orders === 0 ? (
        <span className="text-small-admin text-muted">{dict.noOrders}</span>
      ) : (
        <>
          <span className={`text-small-admin tabular-nums ${counters[tone]}`}>
            {fill(tone === "full" ? dict.orderCountsFull : dict.orderCounts, { verified: day.verified, pending: day.pending })}
          </span>
          <Link
            href={day.editHref}
            aria-label={open}
            className="-mx-1 flex flex-col gap-1 rounded-chip px-1 py-1 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
          >
            {day.liveOrders.slice(0, SHOWN).map((order) => {
              const item = mainItemText(order, dict)
              return (
                <span key={order.id} className="flex min-w-0 items-center gap-2 text-small-admin">
                  <span
                    title={order.verified ? dict.verified : dict.pending}
                    className={`size-2 shrink-0 rounded-pill ${dots[order.verified ? "verified" : "pending"]}`}
                  />
                  <span className="truncate">
                    <span className="font-semibold">{order.name}</span>
                    {item ? ` · ${item}` : null}
                  </span>
                </span>
              )
            })}
            {orders > SHOWN ? (
              <span className="text-small-admin text-muted tabular-nums">{fill(dict.moreOrders, { count: orders - SHOWN })}</span>
            ) : null}
          </Link>
        </>
      )}
    </div>
  )
}
