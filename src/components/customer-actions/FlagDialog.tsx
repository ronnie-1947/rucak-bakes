"use client"

import { Button, type ButtonVariant } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { CustomerTarget } from "@/hooks/useCustomerActions"
import type { FlagChange } from "@/lib/customers/changes"
import { fill } from "@/lib/template"
import type { ActionsCopy } from "./types"

type FlagDialogProps = {
  change: FlagChange
  target: CustomerTarget
  /** Settings.autoVerifyTrusted — trusting only skips the call when it's on, and the confirm says which. */
  autoVerifyTrusted: boolean
  dict: ActionsCopy
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

const confirms: Record<FlagChange, ButtonVariant> = {
  trust: "primary",
  untrust: "primary",
  block: "danger",
  unblock: "primary",
}

/** The confirm every trust / block change goes through: who, which number, and what changes for their orders. */
export function FlagDialog({ change, target, autoVerifyTrusted, dict, pending, onClose, onConfirm }: FlagDialogProps) {
  const d = dict.dialogs
  const values = { name: target.name, phone: target.phoneDisplay }
  const copy: Record<FlagChange, { title: string; body: string; ok: string }> = {
    trust: { title: d.trustTitle, body: autoVerifyTrusted ? d.trustBody : d.trustBodyManual, ok: d.trustOk },
    untrust: { title: d.untrustTitle, body: autoVerifyTrusted ? d.untrustBody : d.untrustBodyManual, ok: d.untrustOk },
    block: { title: d.blockTitle, body: d.blockBody, ok: d.blockOk },
    unblock: { title: d.unblockTitle, body: d.unblockBody, ok: d.unblockOk },
  }
  const { title, body, ok } = copy[change]

  return (
    <Dialog
      open
      onClose={onClose}
      title={fill(title, values)}
      closeLabel={d.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {d.cancel}
          </Button>
          <Button variant={confirms[change]} disabled={pending} onClick={onConfirm}>
            {ok}
          </Button>
        </>
      }
    >
      <p className="text-pretty tabular-nums">{fill(body, values)}</p>
    </Dialog>
  )
}
