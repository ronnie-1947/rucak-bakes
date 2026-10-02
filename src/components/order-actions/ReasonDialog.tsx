"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { Dialog } from "@/components/ui/Dialog"
import type { ActionTarget } from "@/hooks/useOrderActions"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type ReasonDialogProps = {
  kind: "cancel" | "noShow"
  targets: ActionTarget[]
  dict: OrdersCopy["dialogs"]
  pending: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

/**
 * Cancel / no-show confirm. Names every order affected (code · name), states the consequence, and won't
 * proceed without a reason — the reason is what the owner reads later on the order.
 */
export function ReasonDialog({ kind, targets, dict, pending, onClose, onConfirm }: ReasonDialogProps) {
  const [reason, setReason] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const many = targets.length > 1
  const reasons = kind === "cancel" ? dict.cancelReasons : dict.noShowReasons
  const title = kind === "cancel" ? (many ? fill(dict.cancelTitleMany, { count: targets.length }) : dict.cancelTitle) : dict.noShowTitle
  const ok = kind === "cancel" ? (many ? dict.cancelOkMany : dict.cancelOk) : dict.noShowOk

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {dict.keep}
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!reason) setMissing(true)
              else onConfirm(reason)
            }}
          >
            {ok}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1">
          {targets.map((target) => (
            <li key={target.id} className="font-medium">
              {target.code} · {target.name}
            </li>
          ))}
        </ul>
        <p className="text-small-admin text-muted">{kind === "cancel" ? dict.cancelConsequence : dict.noShowConsequence}</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-small-admin text-muted">{dict.reason}</legend>
          <div className="flex flex-wrap gap-2">
            {reasons.map((option) => (
              <Chip
                key={option}
                selected={reason === option}
                onClick={() => {
                  setReason(option)
                  setMissing(false)
                }}
              >
                {option}
              </Chip>
            ))}
          </div>
          {missing ? (
            <p role="alert" className="text-small-admin text-red">
              {dict.reasonRequired}
            </p>
          ) : null}
        </fieldset>
      </div>
    </Dialog>
  )
}
