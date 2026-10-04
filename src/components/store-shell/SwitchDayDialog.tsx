"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { IsoDate } from "@/lib/dates"
import { relativeDay } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { type CartCopy, itemsText } from "./copy"

type SwitchDayDialogProps = {
  /** Null keeps the dialog closed. */
  request: { from: IsoDate; to: IsoDate; count: number } | null
  today: IsoDate
  onConfirm: () => void
  onClose: () => void
  dict: CartCopy
}

/** "Switch to Saturday? Your cart will be cleared" — an order is for one day, so adding for another day empties the cart. */
export function SwitchDayDialog({ request, today, onConfirm, onClose, dict }: SwitchDayDialogProps) {
  const d = dict.switchDay
  const day = (date: IsoDate) => relativeDay(date, today, dict.days)
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      title={request ? fill(d.title, { day: day(request.to) }) : ""}
      closeLabel={d.close}
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            {d.keep}
          </Button>
          <Button size="lg" className="font-semibold" onClick={onConfirm}>
            {d.confirm}
          </Button>
        </>
      }
    >
      {request ? <p className="text-pretty">{fill(d.body, { items: itemsText(request.count, dict.shell), from: day(request.from) })}</p> : null}
    </Dialog>
  )
}
