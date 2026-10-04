"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Notice } from "@/components/ui/Notice"
import { formatWeekday, type IsoDate } from "@/lib/dates"
import type { CartDay } from "@/lib/storefront/cart"
import { fill } from "@/lib/template"
import { type CartPageCopy, dayTitle, type Fulfilment, orderBy } from "./copy"
import { DayChoice } from "./DayChoice"

type DaySheetProps = {
  open: boolean
  onClose: () => void
  /** The cart's day. */
  current: IsoDate
  days: CartDay[]
  today: IsoDate
  type: Fulfilment
  /** A move is on its way — every choice waits. */
  busy: boolean
  onPick: (date: IsoDate) => void
  copy: CartPageCopy
}

/**
 * Change day — every planned day of the order-ahead window, those that can't take the order disabled with the
 * reason. A bottom sheet on phones, a dialog from 640px (the Dialog primitive). Picking moves the cart there.
 */
export function DaySheet({ open, onClose, current, days, today, type, busy, onPick, copy }: DaySheetProps) {
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
        <ul className="flex flex-col gap-2" aria-busy={busy || undefined}>
          {days.map((day) => {
            const isCurrent = day.date === current
            const look = isCurrent ? "current" : day.status === "open" && !busy ? "open" : "off"
            const side = isCurrent
              ? s.current
              : day.status === "open"
                ? fill(s.left, { left: day.left, capacity: day.capacity })
                : s.status[day.status]
            return (
              <li key={day.date}>
                <DayChoice
                  title={dayTitle(day.date, today, copy)}
                  sub={orderBy(day, today, copy)}
                  side={side}
                  look={look}
                  onPick={() => (isCurrent ? onClose() : onPick(day.date))}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </Dialog>
  )
}
