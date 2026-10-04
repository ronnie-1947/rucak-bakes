"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Notice } from "@/components/ui/Notice"
import type { SheetDay } from "@/lib/cart/check"
import { formatWeekday, type IsoDate } from "@/lib/dates"
import { type BookingWindow, FEW_ORDERS_LEFT } from "@/lib/orders/deadline"
import { fill } from "@/lib/template"
import { type CartPageCopy, dayTitle, type Fulfilment, orderBy } from "./copy"
import { DayChoice } from "./DayChoice"

type DaySheetProps = {
  open: boolean
  onClose: () => void
  /** The cart's day. */
  current: IsoDate
  /** Tomorrow to the end of the booking window, judged for every line in the cart (`sheetDays`). */
  rows: SheetDay[]
  booking: BookingWindow
  type: Fulfilment
  onPick: (date: IsoDate) => void
  copy: CartPageCopy
}

/**
 * Change day — the booking window's dates; those that can't take every line are disabled with the reason (closed › fully
 * booked › too soon for the longest-notice line). Items stay in the cart. A bottom sheet on phones, a dialog from 640px.
 */
export function DaySheet({ open, onClose, current, rows, booking, type, onPick, copy }: DaySheetProps) {
  const s = copy.cart.sheet
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={s.title[type]}
      closeLabel={s.close}
      footer={
        <Button variant="outlineLink" size="lg" onClick={onClose} className="w-full">
          {fill(s.keep, { day: formatWeekday(current) })}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Notice tone="warm">{s.warning}</Notice>
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const off = row.state === "open" ? null : row.state
            const sub = !off
              ? orderBy(row.deadline, booking, copy)
              : off === "tooSoon" && row.blocker
                ? fill(s.tooSoonFor, { name: row.blocker.name })
                : s.status[off]
            const side = row.isCurrent
              ? s.current
              : off
                ? s.status[off]
                : row.left > FEW_ORDERS_LEFT
                  ? s.open
                  : row.left === 1
                    ? s.leftOne
                    : fill(s.left, { count: row.left })
            return (
              <li key={row.date}>
                <DayChoice
                  title={dayTitle(row.date, booking.today, copy)}
                  sub={sub}
                  side={side}
                  sideTone={row.isCurrent ? "accent" : !off ? "green" : off === "full" ? "red" : "muted"}
                  look={row.isCurrent ? "current" : off ? "off" : "open"}
                  onPick={() => (row.isCurrent ? onClose() : onPick(row.date))}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </Dialog>
  )
}
