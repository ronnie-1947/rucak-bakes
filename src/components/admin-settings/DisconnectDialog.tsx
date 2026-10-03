"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { SettingsCopy } from "./types"

type DisconnectDialogProps = {
  pending: boolean
  dict: SettingsCopy["telegram"]
  onClose: () => void
  onConfirm: () => void
}

/** Disconnecting stops every order alert — the confirm says so, and that the Orders page still has them. */
export function DisconnectDialog({ pending, dict, onClose, onConfirm }: DisconnectDialogProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={dict.disconnectTitle}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.cancel}
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {dict.disconnectOk}
          </Button>
        </>
      }
    >
      <p className="text-pretty">{dict.disconnectBody}</p>
    </Dialog>
  )
}
