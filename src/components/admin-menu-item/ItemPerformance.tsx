import Link from "next/link"
import type { ItemPerformance as Performance, UpcomingDay } from "@/lib/menu/item"
import { fill } from "@/lib/template"
import type { ItemCopy } from "./types"

type ItemPerformanceProps = {
  performance: Performance
  upcoming: UpcomingDay[]
  dict: ItemCopy["performance"]
}

/** "24 made · 4 ordered", "4 ordered", "24 made". */
function dayLine(day: UpcomingDay, dict: ItemCopy["performance"]): string {
  const made = day.made === null ? null : fill(dict.made, { count: day.made })
  const ordered = day.ordered > 0 ? fill(dict.ordered, { count: day.ordered }) : null
  return [made, ordered].filter(Boolean).join(" · ")
}

/**
 * From 1600px, a third column: the last 30 days — orders for it, and its days on the counter — then what's coming up:
 * each date from today with orders for it or with it on the counter.
 */
export function ItemPerformance({ performance, upcoming, dict }: ItemPerformanceProps) {
  const soldOut =
    performance.soldOutDays === 0
      ? dict.none
      : performance.soldOutDays === 1
        ? dict.soldOutDaysOne
        : fill(dict.soldOutDays, { count: performance.soldOutDays })
  const rows = [
    { label: dict.orders, value: String(performance.orders) },
    { label: dict.unitsOrdered, value: String(performance.unitsOrdered) },
    { label: dict.counterDays, value: String(performance.counterDays) },
    { label: dict.soldOut, value: soldOut },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col rounded-panel border border-border p-3">
        <h2 className="pb-2 font-sans text-micro font-semibold text-muted uppercase">{dict.title}</h2>
        <dl className="flex flex-col tabular-nums">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-2 border-t border-border py-2">
              <dt className="text-muted">{row.label}</dt>
              <dd className="font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col rounded-panel border border-border p-3">
        <h2 className="pb-2 font-sans text-micro font-semibold text-muted uppercase">{dict.upcoming}</h2>
        {upcoming.length === 0 ? <p className="border-t border-border py-2 text-small-admin text-muted">{dict.upcomingNone}</p> : null}
        <ul className="flex flex-col tabular-nums">
          {upcoming.map((day) => (
            <li key={day.date} className="flex flex-col border-t border-border py-2">
              <span className="font-semibold">{day.isToday ? fill(dict.today, { day: day.dayLabel }) : day.dayLabel}</span>
              <span className="text-small-admin text-muted">{dayLine(day, dict)}</span>
            </li>
          ))}
        </ul>
        <Link href="/admin/calendar" className="flex min-h-11 items-center text-small-admin font-semibold text-o700 hover:underline">
          {dict.openCalendar}
        </Link>
      </section>
    </div>
  )
}
