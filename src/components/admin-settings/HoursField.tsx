"use client"

import { Button } from "@/components/ui/Button"
import { HOUR_TIMES, hoursProblem, type OpeningHours, WEEK } from "@/lib/settings/hours"
import { sectionHref } from "@/lib/settings/sections"
import { fill } from "@/lib/template"
import { DayHoursRow } from "./DayHoursRow"
import { GuardedLink } from "./GuardedLink"
import { fullRow } from "./layout"
import type { SettingsCopy } from "./types"

type HoursFieldProps = {
  hours: OpeningHours
  onChange: (hours: OpeningHours) => void
  /** Never saved yet: customers see no hours until this section is. */
  unsaved: boolean
  error?: string
  dict: SettingsCopy["bakery"]
}

/**
 * The seven days, Monday first. "Copy … to every day" takes the first open day's times to all the others;
 * which days are open stays as it is. The line under it points to where ordering closes is set.
 */
export function HoursField({ hours, onChange, unsaved, error, dict }: HoursFieldProps) {
  const times = [...new Set([...HOUR_TIMES, ...WEEK.flatMap((day) => [hours[day].from, hours[day].to])])].sort()
  const first = WEEK.find((day) => hours[day].open)
  const copyFirst = () => {
    if (!first) return
    const { from, to } = hours[first]
    onChange(Object.fromEntries(WEEK.map((day) => [day, { ...hours[day], from, to }])) as OpeningHours)
  }

  return (
    <div role="group" aria-labelledby="hours-label" className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
      <span id="hours-label" className="text-small-admin text-muted">
        {dict.hours}
      </span>
      <div className="@container">
        <ul className={`flex flex-col rounded-panel border ${error ? "border-red" : "border-border"}`}>
          {WEEK.map((day) => (
            <DayHoursRow
              key={day}
              day={dict.days[day]}
              hours={hours[day]}
              times={times}
              invalid={hoursProblem(hours[day])}
              onChange={(next) => onChange({ ...hours, [day]: next })}
              dict={dict}
            />
          ))}
        </ul>
      </div>
      {first ? (
        <Button variant="link" size="inline" className="self-start" onClick={copyFirst}>
          {fill(dict.copyToAll, { day: dict.days[first] })}
        </Button>
      ) : null}
      {error ? <span className="text-small-admin text-red">{error}</span> : null}
      {unsaved ? <span className="text-small-admin text-pretty text-o700">{dict.hoursNotSet}</span> : null}
      <span className="text-small-admin text-pretty text-muted">
        {dict.hoursHint}{" "}
        <GuardedLink href={sectionHref("ordering")} className="font-semibold text-o700 hover:underline">
          {dict.hoursLink}
        </GuardedLink>
        .
      </span>
    </div>
  )
}
