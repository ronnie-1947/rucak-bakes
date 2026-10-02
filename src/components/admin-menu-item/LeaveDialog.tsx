"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { ChangeKey } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import { changesText } from "./copy"
import type { ItemCopy } from "./types"

type LeaveDialogProps = {
  changes: ChangeKey[]
  dict: ItemCopy
  onClose: () => void
  onLeave: () => void
}

/** Back with unsaved changes: names what would be lost. Keep editing is the safe default. */
export function LeaveDialog({ changes, dict, onClose, onLeave }: LeaveDialogProps) {
  const l = dict.leave
  const list = changesText(changes, dict)
  return (
    <Dialog
      open
      onClose={onClose}
      title={l.title}
      closeLabel={l.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {l.keep}
          </Button>
          <Button variant="danger" onClick={onLeave}>
            {l.ok}
          </Button>
        </>
      }
    >
      <p className="text-pretty">{changes.length === 1 ? fill(l.bodyOne, { list }) : fill(l.body, { count: changes.length, list })}</p>
    </Dialog>
  )
}
