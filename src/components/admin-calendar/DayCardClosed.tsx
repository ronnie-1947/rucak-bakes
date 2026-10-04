import Link from "next/link"
import { Tag } from "@/components/ui/Tag"
import { dayOrdersHref } from "@/lib/calendar/routes"
import type { WeekDay } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import type { CalendarCopy } from "./types"

type DayCardClosedProps = {
  day: WeekDay
  dict: CalendarCopy
}

/**
 * A closed day: "Closed", the reason when there is one, and — when orders were placed before it closed — a
 * red block naming them ("3 orders on this day — Ravi, Kavya, Farhan"), with the way to those orders. Closing never
 * cancels them.
 */
export function DayCardClosed({ day, dict }: DayCardClosedProps) {
  const count = day.liveOrders.length
  const names = day.liveOrders.map((order) => order.name).join(", ")
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 opacity-55">
        <span className="font-medium text-muted">{dict.closed}</span>
        {day.closureNote ? <Tag tone="neutral">{day.closureNote}</Tag> : null}
      </div>
      {count > 0 ? (
        <div role="alert" className="flex flex-col rounded-chip border border-red bg-red-soft px-3 pt-2">
          <span className="text-small-admin font-semibold text-red tabular-nums">
            {fill(count === 1 ? dict.closedWarningOne : dict.closedWarning, { count, names })}
          </span>
          <Link href={dayOrdersHref(day.date)} className="flex min-h-11 items-center text-small-admin font-semibold text-o700 hover:underline">
            {dict.viewOrders}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
