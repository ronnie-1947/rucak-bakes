"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { DayOrder } from "@/lib/calendar/week"
import type { Dict } from "@/lib/i18n"
import { fill } from "@/lib/template"

type CloseDayDialogProps = {
  /** "Saturday 3 Oct" */
  day: string
  orders: DayOrder[]
  dict: Dict["admin"]["closeDay"]
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * Closing a day that already has orders: names every order (code · customer) and says what happens to
 * them — nothing. Closing stops new orders; the owner calls the ones already placed. Keep open is the
 * safe default.
 */
export function CloseDayDialog({ day, orders, dict, pending, onClose, onConfirm }: CloseDayDialogProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={fill(dict.title, { day })}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.keep}
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {dict.ok}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-pretty">{orders.length === 1 ? dict.bodyOne : fill(dict.body, { count: orders.length })}</p>
        <ul className="flex flex-col">
          {orders.map((order) => (
            <li key={order.id} className="border-t border-border first:border-t-0">
              <Link href={`/admin/orders/${order.id}`} className="flex min-h-11 items-center font-medium tabular-nums hover:text-o700 hover:underline">
                {fill(dict.order, { code: order.code, name: order.name })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}
