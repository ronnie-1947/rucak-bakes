"use client"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type LeaveDialogProps = {
  section: string
  changes: number
  dict: SettingsCopy["leave"]
  onClose: () => void
  onLeave: () => void
}

/** Another section or Back with unsaved changes. Keep editing is the safe default. */
export function LeaveDialog({ section, changes, dict, onClose, onLeave }: LeaveDialogProps) {
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
      <p className="text-pretty tabular-nums">{changes === 1 ? fill(dict.bodyOne, { section }) : fill(dict.body, { count: changes, section })}</p>
    </Dialog>
  )
}
