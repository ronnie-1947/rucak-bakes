"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type PauseDialogProps = {
  reason: string
  dict: SettingsCopy["pause"]
  onClose: () => void
  onConfirm: () => void
}

/** Pausing closes the shop at once — the confirm quotes exactly what customers will read. Resuming needs none. */
export function PauseDialog({ reason, dict, onClose, onConfirm }: PauseDialogProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={dict.confirmTitle}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {dict.confirmOk}
          </Button>
        </>
      }
    >
      <p className="text-pretty">{fill(dict.confirmBody, { reason })}</p>
    </Dialog>
  )
}
