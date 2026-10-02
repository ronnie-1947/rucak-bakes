import type { DayEditorData } from "@/lib/calendar/day"
import { DayEditor } from "./DayEditor"
import type { AdminCopy } from "./types"

type AdminCalendarDayProps = {
  dict: AdminCopy
  data: DayEditorData
}

/** /admin/calendar/[date] — one day's plan. Keyed by date, so ‹ › starts the next day's editor fresh. */
export function AdminCalendarDay({ dict, data }: AdminCalendarDayProps) {
  return <DayEditor key={data.date} data={data} dict={dict} />
}
