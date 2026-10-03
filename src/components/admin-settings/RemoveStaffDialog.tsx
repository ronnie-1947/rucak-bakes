"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type RemoveStaffDialogProps = {
  name: string
  pending: boolean
  dict: SettingsCopy["staff"]
  onClose: () => void
  onConfirm: () => void
}

/** Removing someone signs them out for good — the confirm names them and says how they'd get back. */
export function RemoveStaffDialog({ name, pending, dict, onClose, onConfirm }: RemoveStaffDialogProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={fill(dict.removeTitle, { name })}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.cancel}
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {dict.removeOk}
          </Button>
        </>
      }
    >
      <p className="text-pretty">{dict.removeBody}</p>
    </Dialog>
  )
}
