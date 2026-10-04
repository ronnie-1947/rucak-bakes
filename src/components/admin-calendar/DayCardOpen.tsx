import { Icon } from "@/components/ui/icons/Icon"
import { SelectField } from "@/components/ui/SelectField"
import { Stepper } from "@/components/ui/Stepper"
import { type CutoffChoice, cutoffKey, parseCutoffKey } from "@/lib/calendar/cutoffs"
import { CARD_MAX_ORDERS } from "@/lib/calendar/form"
import type { WeekDay } from "@/lib/calendar/week"
import { cutoffSelectOptions } from "./copy"
import { DayCounter } from "./DayCounter"
import { DayOrders } from "./DayOrders"
import type { AdminCopy } from "./types"

type DayCardOpenProps = {
  day: WeekDay
  cutoff: CutoffChoice
  maxOrders: number
  onCutoff: (cutoff: CutoffChoice) => void
  onMaxOrders: (max: number) => void
  dict: AdminCopy
}

/**
 * An open day's body (§10R): its orders against max, when orders close, Max orders, then its counter-items at the foot.
 * Controls sit beside their labels on wide cards and under them on the narrow ones.
 */
export function DayCardOpen({ day, cutoff, maxOrders, onCutoff, onMaxOrders, dict }: DayCardOpenProps) {
  const d = dict.calendar
  return (
    <div className="flex flex-1 flex-col gap-3">
      <DayOrders day={day} maxOrders={maxOrders} dict={d} />

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

      <div className="flex items-center justify-between gap-x-2 gap-y-1 xl:flex-col xl:items-stretch">
        <span className="text-small-admin whitespace-nowrap text-muted">{d.maxOrders}</span>
        <div className="w-32 xl:w-full">
          <Stepper
            value={maxOrders}
            min={CARD_MAX_ORDERS.min}
            max={CARD_MAX_ORDERS.max}
            onChange={onMaxOrders}
            decreaseLabel={d.fewer}
            increaseLabel={d.more}
            width="full"
          />
        </div>
      </div>

      <DayCounter day={day} dict={d} />
    </div>
  )
}
