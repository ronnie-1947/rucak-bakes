"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { fill } from "@/lib/template"
import type { DayCopy } from "./types"

type LeaveDialogProps = {
  day: string
  changes: number
  dict: DayCopy["leave"]
  onClose: () => void
  onLeave: () => void
}

/** Back, ‹ or › with unsaved changes. Keep editing is the safe default. */
export function LeaveDialog({ day, changes, dict, onClose, onLeave }: LeaveDialogProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={dict.title}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.keep}
          </Button>
          <Button variant="danger" onClick={onLeave}>
            {dict.ok}
          </Button>
        </>
      }
    >
      <p className="text-pretty tabular-nums">{changes === 1 ? fill(dict.bodyOne, { day }) : fill(dict.body, { count: changes, day })}</p>
    </Dialog>
  )
}
