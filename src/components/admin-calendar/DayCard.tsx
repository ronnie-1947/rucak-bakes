"use client"

import { CloseDayDialog } from "@/components/close-day-dialog/CloseDayDialog"
import type { WeekDay } from "@/lib/calendar/week"
import { pastLine } from "./copy"
import { DayCardClosed } from "./DayCardClosed"
import { DayCardHeader } from "./DayCardHeader"
import { DayCardOpen } from "./DayCardOpen"
import type { AdminCopy } from "./types"
import { useDayPatch } from "./useDayPatch"

type DayCardProps = {
  day: WeekDay
  dict: AdminCopy
}

/**
 * One day of the week (§10R): its orders, then the controls that save as they change — the Open switch, Orders close and
 * Max orders — then its counter-items, the way into the day editor. Past days are a read-only line. On the 820px tablet's
 * two columns, Sunday spans both.
 */
export function DayCard({ day, dict }: DayCardProps) {
  const d = dict.calendar
  const patch = useDayPatch(day)
  const { isOpen, cutoff, maxOrders } = patch.values

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-panel border border-border bg-background p-3 md:last:col-span-2 xl:last:col-span-1">
      <DayCardHeader day={day} isOpen={isOpen} onToggle={() => patch.setOpen(!isOpen)} dict={d} />

      {day.isPast ? (
        <span className="text-small-admin text-muted tabular-nums">{pastLine(day, d)}</span>
      ) : isOpen ? (
        <DayCardOpen day={day} cutoff={cutoff} maxOrders={maxOrders} onCutoff={patch.setCutoff} onMaxOrders={patch.setMaxOrders} dict={dict} />
      ) : (
        <DayCardClosed day={day} dict={d} />
      )}

      {patch.failed ? (
        <span role="alert" className="text-small-admin text-red">
          {d.failed}
        </span>
      ) : null}

      {patch.closing ? (
        <CloseDayDialog
          day={`${day.weekdayName} ${day.dateLabel}`}
          orders={patch.closing}
          dict={dict.closeDay}
          pending={patch.pending}
          onClose={patch.cancelClose}
          onConfirm={patch.confirmClose}
        />
      ) : null}
    </li>
  )
}
