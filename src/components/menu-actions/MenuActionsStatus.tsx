"use client"

import { Notice } from "@/components/ui/Notice"
import { useMenuActions } from "@/hooks/useMenuActions"
import { UndoBar } from "@/components/ui/UndoBar"
import type { MenuCopy } from "./types"

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
        <UndoBar
          text={status.undo.text}
          link={status.undo.link}
          undo={{ label: dict.undo, onUndo: status.revert, pending }}
          dismissLabel={dict.dismiss}
          onDismiss={status.dismiss}
        />
      ) : null}
    </>
  )
}
