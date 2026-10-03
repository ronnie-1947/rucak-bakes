"use client"

import { SelectField } from "@/components/ui/SelectField"
import { Switch } from "@/components/ui/Switch"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { DayHours } from "@/lib/settings/hours"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type DayHoursRowProps = {
  day: string
  hours: DayHours
  /** The half-hour times, plus any saved time that isn't on the half hour. */
  times: string[]
  invalid: boolean
  onChange: (hours: DayHours) => void
  dict: SettingsCopy["bakery"]
}

/**
 * One weekday: Open/Closed, and when open, from–to. In a narrow pane the times wrap under the day; once the
 * hours box is 512px wide they sit on the same line.
 */
export function DayHoursRow({ day, hours, times, invalid, onChange, dict }: DayHoursRowProps) {
  const options = times.map((time) => ({ value: time, label: formatClock(time) }))
  return (
    <li className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border px-3 py-2 first:border-t-0 @lg:grid-cols-[6.5rem_auto_minmax(0,1fr)]">
      <span className="font-semibold">{day}</span>
      <Switch
        checked={hours.open}
        onChange={() => onChange({ ...hours, open: !hours.open })}
        stateLabel={hours.open ? dict.open : dict.closed}
        label={fill(dict.dayOpen, { day })}
      />
      {hours.open ? (
        <div className="col-span-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 @lg:col-span-1">
          <SelectField
            value={hours.from}
            options={options}
            aria-label={fill(dict.opens, { day })}
            aria-invalid={invalid || undefined}
            onChange={(event) => onChange({ ...hours, from: event.target.value })}
          />
          <span className="text-small-admin text-muted">{dict.to}</span>
          <SelectField
            value={hours.to}
            options={options}
            aria-label={fill(dict.closes, { day })}
            aria-invalid={invalid || undefined}
            onChange={(event) => onChange({ ...hours, to: event.target.value })}
          />
        </div>
      ) : null}
    </li>
  )
}
