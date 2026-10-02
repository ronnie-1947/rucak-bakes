"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Dialog } from "@/components/ui/Dialog"
import type { ItemTarget } from "@/hooks/useMenuActions"
import { fill } from "@/lib/template"
import { targetsLabel } from "./copy"
import { ScheduleLines } from "./ScheduleLines"
import type { MenuCopy } from "./types"

type DeactivateDialogProps = {
  targets: ItemTarget[]
  dict: MenuCopy
  pending: boolean
  onClose: () => void
  onConfirm: (removeFromDays: boolean) => void
}

/**
 * Deactivating an item that's on upcoming days. Names those days, and offers to take it off them too
 * (ticked by default) — a day that already has orders for it keeps it.
 */
export function DeactivateDialog({ targets, dict, pending, onClose, onConfirm }: DeactivateDialogProps) {
  const [remove, setRemove] = useState(true)
  const d = dict.dialogs
  const anyOrdered = targets.some((target) => target.upcoming.some((day) => day.ordered > 0))

  return (
    <Dialog
      open
      onClose={onClose}
      title={fill(d.deactivateTitle, { label: targetsLabel(targets, dict) })}
      closeLabel={d.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {d.keepActive}
          </Button>
          <Button variant="primary" disabled={pending} onClick={() => onConfirm(remove)}>
            {d.deactivateOk}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-pretty">{d.deactivateBody}</p>
        <ScheduleLines targets={targets} dict={d} />
        <Checkbox
          checked={remove}
          onChange={(event) => setRemove(event.target.checked)}
          label={targets.length > 1 ? d.removeFromDaysMany : d.removeFromDays}
          hint={anyOrdered ? d.keepsOrdered : undefined}
        />
      </div>
    </Dialog>
  )
}
