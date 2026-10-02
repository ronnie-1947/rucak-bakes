import { Switch } from "@/components/ui/Switch"
import { Tag } from "@/components/ui/Tag"
import type { WeekDay } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import type { CalendarCopy } from "./types"

type DayCardHeaderProps = {
  day: WeekDay
  isOpen: boolean
  onToggle: () => void
  dict: CalendarCopy
}

const titleLooks: Record<"past" | "closed" | "open", string> = {
  past: "opacity-60",
  closed: "opacity-55",
  open: "",
}

/**
 * Weekday, date and the Today tag; the Open switch for days not yet past. In a row on narrow cards,
 * stacked in the seven narrow columns from 1280px.
 */
export function DayCardHeader({ day, isOpen, onToggle, dict }: DayCardHeaderProps) {
  const look = day.isPast ? "past" : isOpen ? "open" : "closed"
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 xl:flex-col xl:items-start">
      <div className={`flex min-w-0 flex-wrap items-baseline gap-x-2 xl:flex-col xl:items-start ${titleLooks[look]}`}>
        <h2 className="text-h2">{day.weekdayName}</h2>
        <span className="text-small-admin text-muted tabular-nums">{day.dateLabel}</span>
        {day.isToday ? <Tag tone="warm">{dict.today}</Tag> : null}
      </div>
      {day.isPast ? null : (
        <Switch
          checked={isOpen}
          onChange={onToggle}
          stateLabel={isOpen ? dict.open : dict.closed}
          label={fill(dict.switchLabel, { day: `${day.weekdayName} ${day.dateLabel}` })}
        />
      )}
    </div>
  )
}
