"use client"

import { Notice } from "@/components/ui/Notice"
import { UndoBar } from "@/components/ui/UndoBar"
import { useCustomerActions } from "@/hooks/useCustomerActions"
import type { ActionsCopy } from "./types"

type CustomerActionsStatusProps = {
  dict: ActionsCopy
}

/** The failure notice and the green undo strip of the nearest CustomerActionsProvider. Renders nothing between changes. */
export function CustomerActionsStatus({ dict }: CustomerActionsStatusProps) {
  const { status, pending } = useCustomerActions()
  return (
    <>
      {status.failed ? <Notice tone="error">{dict.failed}</Notice> : null}
      {status.undo ? (
        <UndoBar text={status.undo} undo={{ label: dict.undo, onUndo: status.revert, pending }} dismissLabel={dict.dismiss} onDismiss={status.dismiss} />
      ) : null}
    </>
  )
}
