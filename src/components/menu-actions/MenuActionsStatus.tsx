"use client"

import { Notice } from "@/components/ui/Notice"
import { useMenuActions } from "@/hooks/useMenuActions"
import type { MenuCopy } from "./types"
import { UndoBar } from "./UndoBar"

type MenuActionsStatusProps = {
  dict: MenuCopy
}

/** The failure notice and the green undo strip of the nearest MenuActionsProvider. Renders nothing between changes. */
export function MenuActionsStatus({ dict }: MenuActionsStatusProps) {
  const { status, pending } = useMenuActions()
  return (
    <>
      {status.failed ? <Notice tone="error">{dict.failed}</Notice> : null}
      {status.undo ? (
        <UndoBar text={status.undo.text} link={status.undo.link} dict={dict} pending={pending} onUndo={status.revert} onDismiss={status.dismiss} />
      ) : null}
    </>
  )
}
