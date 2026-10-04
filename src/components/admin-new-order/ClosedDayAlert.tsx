import { ButtonLink } from "@/components/ui/ButtonLink"
import { Notice } from "@/components/ui/Notice"
import { dayHref } from "@/lib/calendar/routes"
import { formatWeekday, type IsoDate } from "@/lib/dates"
import { fill } from "@/lib/template"
import type { NewOrderCopy } from "./types"

type ClosedDayAlertProps = {
  date: IsoDate
  dict: NewOrderCopy
}

/**
 * The day picked is closed — only reachable by a `?date=` link, or when it closed while the form was open. Staff can't book
 * a closed day; the Calendar is where it opens.
 */
export function ClosedDayAlert({ date, dict }: ClosedDayAlertProps) {
  return (
    <Notice tone="error" title={fill(dict.closedDay, { day: formatWeekday(date) })}>
      <ButtonLink href={dayHref(date)} variant="link" size="inline">
        {dict.openCalendar}
      </ButtonLink>
    </Notice>
  )
}
