"use client"

import { SelectField } from "@/components/ui/SelectField"
import { formatClock } from "@/lib/calendar/cutoffs"
import { CUTOFF_DAYS } from "@/lib/settings/form"
import { HOUR_TIMES } from "@/lib/settings/hours"
import { cutoffDayText, cutoffHintText } from "./copy"
import { fullRow } from "./layout"
import type { SettingsCopy } from "./types"

type CutoffFieldProps = {
  time: string
  days: number
  onChange: (cutoff: { cutoffTime: string; cutoffDays: number }) => void
  dict: SettingsCopy
}

/**
 * "Orders close at [6pm] [the day before]" and what that means for a real day, in ink rather than grey —
 * it's the line that tells the owner what they've set. A saved choice off the list stays as an extra option.
 */
export function CutoffField({ time, days, onChange, dict }: CutoffFieldProps) {
  const d = dict.ordering
  const times = HOUR_TIMES.includes(time) ? HOUR_TIMES : [...HOUR_TIMES, time].sort()
  const dayChoices = CUTOFF_DAYS.includes(days) ? CUTOFF_DAYS : [...CUTOFF_DAYS, days]
  return (
    <div role="group" aria-labelledby="cutoff-label" className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
      <span id="cutoff-label" className="text-small-admin text-muted">
        {d.cutoff}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          value={time}
          options={times.map((value) => ({ value, label: formatClock(value) }))}
          aria-label={d.cutoffTime}
          aria-describedby="cutoff-message"
          onChange={(event) => onChange({ cutoffTime: event.target.value, cutoffDays: days })}
        />
        <SelectField
          value={String(days)}
          options={dayChoices.map((value) => ({ value: String(value), label: cutoffDayText(value, d) }))}
          aria-label={d.cutoffDay}
          aria-describedby="cutoff-message"
          onChange={(event) => onChange({ cutoffTime: time, cutoffDays: Number(event.target.value) })}
        />
      </div>
      <span id="cutoff-message" className="text-small-admin text-pretty tabular-nums">
        {cutoffHintText(time, days, dict)}
      </span>
    </div>
  )
}
