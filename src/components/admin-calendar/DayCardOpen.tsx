import { ButtonLink } from "@/components/ui/ButtonLink"
import { Icon } from "@/components/ui/icons/Icon"
import { Meter } from "@/components/ui/Meter"
import { SelectField } from "@/components/ui/SelectField"
import { Stepper } from "@/components/ui/Stepper"
import { type CutoffChoice, cutoffKey, parseCutoffKey } from "@/lib/calendar/cutoffs"
import { MAX_ORDERS } from "@/lib/calendar/form"
import type { WeekDay } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import { cutoffSelectOptions } from "./copy"
import { DayItemsSummary } from "./DayItemsSummary"
import type { AdminCopy } from "./types"

type DayCardOpenProps = {
  day: WeekDay
  cutoff: CutoffChoice
  maxOrders: number
  onCutoff: (cutoff: CutoffChoice) => void
  onMaxOrders: (max: number) => void
  dict: AdminCopy
}

type Fill = "full" | "green" | "warm"

const counters: Record<Fill, string> = {
  full: "font-semibold text-red",
  green: "text-muted",
  warm: "text-muted",
}

/** Full at max; green from 70% (a good day); the warm fill below that. */
function fillOf(verified: number, max: number): Fill {
  if (verified >= max) return "full"
  return verified / max >= 0.7 ? "green" : "warm"
}

/**
 * An open day's body: what's on sale, when orders close, max orders with its capacity bar, and Edit day.
 * Controls sit beside their labels on narrow cards and under them in the 1280px columns.
 */
export function DayCardOpen({ day, cutoff, maxOrders, onCutoff, onMaxOrders, dict }: DayCardOpenProps) {
  const d = dict.calendar
  const tone = fillOf(day.verified, maxOrders)
  const dayName = `${day.weekdayName} ${day.dateLabel}`
  return (
    <div className="flex flex-1 flex-col gap-3">
      <DayItemsSummary items={day.items} dict={d} />

      <label className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 md:flex-col md:items-stretch">
        <span className="flex items-center gap-2 text-small-admin whitespace-nowrap text-muted">
          <Icon name="clock" className="size-4" />
          {d.ordersClose}
        </span>
        <SelectField
          size="sm"
          className="w-44 md:w-full"
          value={cutoffKey(cutoff)}
          options={cutoffSelectOptions([cutoff], dict.cutoffs, "short")}
          onChange={(event) => {
            const next = parseCutoffKey(event.target.value)
            if (next) onCutoff(next)
          }}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-x-2 gap-y-1 xl:flex-col xl:items-stretch">
          <span className="text-small-admin whitespace-nowrap text-muted">{d.maxOrders}</span>
          <div className="w-32 xl:w-full">
            <Stepper
              value={maxOrders}
              min={MAX_ORDERS.min}
              max={MAX_ORDERS.max}
              onChange={onMaxOrders}
              decreaseLabel={d.fewer}
              increaseLabel={d.more}
              width="full"
            />
          </div>
        </div>
        <Meter
          value={day.verified}
          max={maxOrders}
          tone={tone}
          label={fill(d.meterLabel, { day: dayName, verified: day.verified, max: maxOrders })}
        />
        <span className={`text-small-admin tabular-nums ${counters[tone]}`}>
          {fill(tone === "full" ? d.counterFull : d.counter, { verified: day.verified, pending: day.pending })}
        </span>
      </div>

      <ButtonLink href={day.editHref} variant="outline" className="mt-auto w-full" aria-label={fill(d.editDayLabel, { day: dayName })}>
        {d.editDay}
      </ButtonLink>
    </div>
  )
}
