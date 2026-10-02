import { Button } from "@/components/ui/Button"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { dayHref } from "@/lib/calendar/routes"
import { formatWeekday } from "@/lib/dates"
import { fill } from "@/lib/template"
import type { CalendarCopy } from "./types"

type EmptyWeekProps = {
  /** The first day of the week not yet past — where "Plan Monday" goes. */
  firstDay: string
  onCopy: () => void
  dict: CalendarCopy
}

/** A week with no day planned: copy last week, or start with the first day. */
export function EmptyWeek({ firstDay, onCopy, dict }: EmptyWeekProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-panel bg-sunken px-6 py-12 text-center">
      <p className="font-display text-h2 font-semibold">{dict.emptyWeek}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={onCopy}>
          {dict.copyLastWeek}
        </Button>
        <ButtonLink href={dayHref(firstDay)} variant="outline">
          {fill(dict.planDay, { day: formatWeekday(firstDay) })}
        </ButtonLink>
      </div>
    </div>
  )
}
