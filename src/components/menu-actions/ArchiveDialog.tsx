"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { ItemTarget } from "@/hooks/useMenuActions"
import { targetsLabel } from "@/lib/menu/copy"
import { fill } from "@/lib/template"
import { ScheduleLines } from "./ScheduleLines"
import type { MenuCopy } from "./types"

type ArchiveDialogProps = {
  targets: ItemTarget[]
  dict: MenuCopy
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

/** Archive confirm — soft only. States what happens and names every upcoming day it comes off. */
export function ArchiveDialog({ targets, dict, pending, onClose, onConfirm }: ArchiveDialogProps) {
  const d = dict.dialogs
  const scheduled = targets.some((target) => target.upcoming.length > 0)

  return (
    <Dialog
      open
      onClose={onClose}
      title={fill(d.archiveTitle, { label: targetsLabel(targets, dict) })}
      closeLabel={d.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {d.cancel}
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {d.archiveOk}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-pretty">
          {d.archiveBody}
          {scheduled ? ` ${d.archiveRemoves}` : null}
        </p>
        <ScheduleLines targets={targets} dict={d} />
      </div>
    </Dialog>
  )
}
