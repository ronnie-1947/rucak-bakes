import { addDays, formatDayLabel, type IsoDate } from "@/lib/dates"
import type { OrderingValues } from "@/lib/settings/form"
import { fill } from "@/lib/template"
import { cutoffHintText, fulfilmentText } from "./copy"
import type { SettingsCopy } from "./types"

type OrderPagePreviewProps = {
  values: OrderingValues
  today: IsoDate
  dict: SettingsCopy
}

const SHOWN = 7

/**
 * The customer's day picker with these rules: the days they can choose (today only when ordering closes the
 * same day — otherwise today's cutoff has already gone), when ordering closes, and how they can get it.
 */
export function OrderPagePreview({ values, today, dict }: OrderPagePreviewProps) {
  const p = dict.preview
  const first = values.cutoffDays === 0 ? 0 : 1
  const days = Array.from({ length: Math.max(0, values.orderAheadDays - first + 1) }, (_, index) => addDays(today, first + index))
  const ahead = values.orderAheadDays === 1 ? p.aheadOne : fill(p.ahead, { count: values.orderAheadDays })
  const ways = fulfilmentText(values.pickup, values.delivery, values.radiusKm, values.feeRupees, p)

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-background p-4">
      <span className="font-display text-h2 font-semibold">{p.chooseDay}</span>
      <ul className="flex flex-wrap gap-2">
        {days.slice(0, SHOWN).map((date) => (
          <li key={date} className="rounded-chip border border-border px-3 py-1 text-small-admin font-semibold tabular-nums">
            {date === today ? p.today : formatDayLabel(date)}
          </li>
        ))}
        {days.length > SHOWN ? (
          <li className="rounded-chip px-2 py-1 text-small-admin text-muted tabular-nums">{fill(p.moreDays, { count: days.length - SHOWN })}</li>
        ) : null}
      </ul>
      <span className="text-pretty tabular-nums">{cutoffHintText(values.cutoffTime, values.cutoffDays, dict)}</span>
      <span className="text-small-admin text-pretty text-muted tabular-nums">{[ahead, ways].filter(Boolean).join(" · ")}</span>
    </div>
  )
}
