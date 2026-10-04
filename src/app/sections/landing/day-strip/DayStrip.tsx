import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { StoreDay } from "@/lib/storefront/types"
import { DayPanel } from "./DayPanel"
import { DayTabs } from "./DayTabs"

type DayStripProps = {
  /** Today, then tomorrow. */
  days: [StoreDay, StoreDay]
  today: IsoDate
  dict: Dict["landing"]["dayStrip"]
  store: Dict["store"]
}

/**
 * "Baking today" / "Tomorrow": what each day has and whether it still takes orders. Opens on today when
 * today takes orders, else on tomorrow when that does — usually tomorrow, as most days close the evening
 * before.
 */
export function DayStrip({ days, today, dict, store }: DayStripProps) {
  const initial = days[0].status !== "open" && days[1].status === "open" ? 1 : 0
  return (
    <section aria-label={dict.label}>
      <DayTabs
        label={dict.label}
        tabs={[dict.today, dict.tomorrow]}
        initial={initial}
        panels={days.map((day) => (
          <DayPanel key={day.date} day={day} today={today} dict={dict} store={store} />
        ))}
      />
    </section>
  )
}
