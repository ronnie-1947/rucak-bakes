import { ButtonLink } from "@/components/ui/ButtonLink"
import type { WeekDay } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import { counterLine, counterShort } from "./copy"
import type { CalendarCopy } from "./types"

type DayCounterProps = {
  day: WeekDay
  dict: CalendarCopy
}

/**
 * The day's counter-items, pinned to the card's foot above a rule: "Butter croissant ×24 · Cookie ×30", or on the narrow
 * cards from 1280px "5 counter-items · Butter croissant, Cookie +3" — then "+ Add counter-items" (accent) or "Edit
 * counter-items" into the day editor. None: "No counter-items — orders only".
 */
export function DayCounter({ day, dict }: DayCounterProps) {
  const dayName = `${day.weekdayName} ${day.dateLabel}`
  const has = day.counter.length > 0
  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-small-admin font-semibold">{dict.counterTitle}</span>
        <span className="text-small-admin text-muted">{dict.counterSub}</span>
      </span>
      {has ? (
        <>
          <span className="text-small-admin text-pretty tabular-nums xl:hidden">{counterLine(day.counter, dict)}</span>
          <span className="hidden text-small-admin text-pretty tabular-nums xl:block">{counterShort(day.counter, dict)}</span>
        </>
      ) : (
        <span className="text-small-admin text-muted">{dict.counterNone}</span>
      )}
      <ButtonLink
        href={day.editHref}
        variant={has ? "outline" : "outlineLink"}
        className="w-full"
        aria-label={fill(has ? dict.editCounterLabel : dict.addCounterLabel, { day: dayName })}
      >
        {has ? dict.editCounter : dict.addCounter}
      </ButtonLink>
    </div>
  )
}
