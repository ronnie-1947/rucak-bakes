import { dayChip, dayOffer } from "@/components/item-card/offer"
import { ItemCard } from "@/components/item-card/ItemCard"
import { Meter } from "@/components/ui/Meter"
import { Tag } from "@/components/ui/Tag"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { StoreDay } from "@/lib/storefront/types"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { dayLine, dayPill } from "./copy"

type DayPanelProps = {
  day: StoreDay
  today: IsoDate
  dict: Dict["landing"]["dayStrip"]
  store: Dict["store"]
}

/**
 * One day: its status pill and order-slot line, the capacity bar (live orders against the day's limit), the
 * owner's note, and the day's items — a snap-scrolling row that bleeds to the screen edge on phones and
 * tablets, a four-column grid from 1024px.
 */
export function DayPanel({ day, today, dict, store }: DayPanelProps) {
  const pill = dayPill(day, dict)
  const counted = day.status === "open" || day.status === "full"
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Tag tone={pill.tone} size="pill">
          {pill.text}
        </Tag>
        <span className="text-small text-pretty text-muted tabular-nums">{dayLine(day, today, dict, store.days)}</span>
      </div>
      {counted ? (
        <Meter value={day.taken} max={day.capacity} tone={day.status === "full" ? "full" : "warm"} label={fill(dict.meter, { taken: day.taken, capacity: day.capacity })} />
      ) : null}
      {day.note ? <p className="text-pretty">{day.note}</p> : null}
      {day.items.length > 0 ? (
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 md:-mx-6 md:scroll-px-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {day.items.map((item) => (
            <li key={item.id} className="flex w-42 shrink-0 snap-start md:w-50 lg:w-auto">
              <ItemCard
                item={item}
                offer={dayOffer(item, day, today, store)}
                chip={dayChip(item, day, store.item)}
                day={day.date}
                dict={store.item}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      ) : day.status !== "closed" && day.status !== "unplanned" ? (
        <p className="rounded-card bg-sunken px-4 py-8 text-center text-muted">{fill(dict.empty, { day: relativeDay(day.date, today, store.days) })}</p>
      ) : null}
    </div>
  )
}
