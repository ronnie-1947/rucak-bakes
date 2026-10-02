"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { ActionTarget } from "@/hooks/useOrderActions"
import { fill } from "@/lib/template"
import type { OrdersCopy, OverCapacity } from "./types"

type CapacityDialogProps = {
  over: OverCapacity
  targets: ActionTarget[]
  dict: OrdersCopy["dialogs"]
  pending: boolean
  onClose: () => void
  /** Verify the over-capacity orders anyway — the owner's call. */
  onConfirm: () => void
}

export function CapacityDialog({ over, targets, dict, pending, onClose, onConfirm }: CapacityDialogProps) {
  const nameOf = new Map(targets.map((target) => [target.id, target.name]))
  return (
    <Dialog
      open
      onClose={onClose}
      title={dict.overTitle}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.notNow}
          </Button>
          <Button variant="primary" disabled={pending} onClick={onConfirm}>
            {dict.overOk}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {over.map((day) => (
          <div key={day.dayLabel} className="flex flex-col gap-1">
            <p className="font-semibold text-red">{fill(dict.overLine, { wouldBe: day.wouldBe, max: day.maxOrders, day: day.dayLabel })}</p>
            <ul className="flex flex-col">
              {day.ids.map((id, index) => (
                <li key={id}>
                  {day.codes[index]} · {nameOf.get(id)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
