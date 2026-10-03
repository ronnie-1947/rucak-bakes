import { ButtonLink } from "@/components/ui/ButtonLink"
import { EmptyState } from "@/components/ui/EmptyState"
import type { DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import { StateMessage } from "./StateMessage"
import type { DaySheetCopy } from "./types"

type SheetStateProps = {
  data: DaySheetData
  dict: DaySheetCopy
}

/** No live orders on the day: closed in the Calendar, too far ahead to have any, or simply none yet. */
export function SheetState({ data, dict }: SheetStateProps) {
  if (data.state === "closed") {
    return (
      <EmptyState
        message={<StateMessage title={fill(dict.closedTitle, { day: data.title })} body={dict.closedBody} />}
        action={
          <ButtonLink href={data.hrefs.calendar} variant="outlineLink">
            {dict.openCalendar}
          </ButtonLink>
        }
      />
    )
  }
  if (data.state === "beyond") {
    return <EmptyState message={<StateMessage title={dict.beyondTitle} body={fill(dict.beyondBody, { count: data.orderAheadDays, day: data.title })} />} />
  }
  return (
    <EmptyState
      message={<StateMessage title={fill(dict.emptyTitle, { day: data.title })} body={dict.emptyBody} />}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href={data.hrefs.next} variant="outlineLink">
            {fill(dict.viewDay, { day: data.nextLabel })}
          </ButtonLink>
          <ButtonLink href={data.hrefs.calendar} variant="outlineLink">
            {dict.calendar}
          </ButtonLink>
        </div>
      }
    />
  )
}
