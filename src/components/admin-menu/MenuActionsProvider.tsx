"use client"

import { type ReactNode, useCallback, useMemo, useRef, useState, useTransition } from "react"
import { archiveMenuItems, duplicateMenuItem, type MenuChangeResult, restoreMenuItem, setMenuItemsActive, undoMenuChange } from "@/app/actions/menu"
import { Notice } from "@/components/ui/Notice"
import { type ItemTarget, type MenuActionKind, MenuActionsContext, type MenuActionsApi } from "@/hooks/useMenuActions"
import type { MenuSnapshot } from "@/lib/menu/changes"
import { fill } from "@/lib/template"
import { ArchiveDialog } from "./ArchiveDialog"
import { targetsLabel } from "./copy"
import { DeactivateDialog } from "./DeactivateDialog"
import type { MenuCopy } from "./types"
import { UndoBar } from "./UndoBar"

type MenuActionsProviderProps = {
  dict: MenuCopy
  children: ReactNode
}

type OpenDialog = { kind: "deactivate" | "archive"; targets: ItemTarget[] }

type Undo = { text: string; snapshot: MenuSnapshot }

/**
 * Owns every change on the menu library: the confirm dialogs, the server actions, and the green undo
 * strip each change leaves behind. Rows, cards, the ⋯ menu and the bulk bar call useMenuActions().request().
 * The actions revalidate, so the list refreshes itself.
 */
export function MenuActionsProvider({ dict, children }: MenuActionsProviderProps) {
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [undo, setUndo] = useState<Undo | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const onDoneRef = useRef<(() => void) | undefined>(undefined)

  const describe = useCallback(
    (kind: MenuActionKind, targets: ItemTarget[], result: Extract<MenuChangeResult, { ok: true }>) => {
      const label = targetsLabel(targets, dict)
      const changed = dict.changed
      if (kind === "activate") return fill(changed.activated, { label })
      if (kind === "archive") return fill(changed.archived, { label })
      if (kind === "restore") return fill(changed.restored, { label })
      if (kind === "duplicate") return fill(changed.duplicated, { label: result.name ?? label })
      if (result.removedDays === 0) return fill(changed.deactivated, { label })
      return fill(result.removedDays === 1 ? changed.deactivatedRemovedOne : changed.deactivatedRemoved, { label, count: result.removedDays })
    },
    [dict],
  )

  const run = useCallback(
    (kind: MenuActionKind, targets: ItemTarget[], removeFromDays = false) => {
      setFailed(false)
      startTransition(async () => {
        const ids = targets.map((target) => target.id)
        const result =
          kind === "activate" || kind === "deactivate"
            ? await setMenuItemsActive({ ids, active: kind === "activate", removeFromDays })
            : kind === "archive"
              ? await archiveMenuItems({ ids })
              : kind === "restore"
                ? await restoreMenuItem({ id: ids[0] })
                : await duplicateMenuItem({ id: ids[0] })
        setDialog(null)
        if (!result.ok) {
          setFailed(true)
          return
        }
        setUndo({ text: describe(kind, targets, result), snapshot: result.undo })
        onDoneRef.current?.()
      })
    },
    [describe],
  )

  const request = useCallback<MenuActionsApi["request"]>(
    (kind, targets, onDone) => {
      if (targets.length === 0) return
      onDoneRef.current = onDone
      const scheduled = targets.some((target) => target.upcoming.length > 0)
      if (kind === "archive" || (kind === "deactivate" && scheduled)) setDialog({ kind, targets })
      else run(kind, targets)
    },
    [run],
  )

  const revert = () => {
    if (!undo) return
    setFailed(false)
    startTransition(async () => {
      const result = await undoMenuChange(undo.snapshot)
      if (result.ok) setUndo(null)
      else setFailed(true)
    })
  }

  const api = useMemo(() => ({ request, pending }), [request, pending])

  return (
    <MenuActionsContext.Provider value={api}>
      {failed ? <Notice tone="error">{dict.failed}</Notice> : null}
      {undo ? <UndoBar text={undo.text} dict={dict} pending={pending} onUndo={revert} onDismiss={() => setUndo(null)} /> : null}
      {children}
      {dialog?.kind === "deactivate" ? (
        <DeactivateDialog
          targets={dialog.targets}
          dict={dict}
          pending={pending}
          onClose={() => setDialog(null)}
          onConfirm={(removeFromDays) => run("deactivate", dialog.targets, removeFromDays)}
        />
      ) : null}
      {dialog?.kind === "archive" ? (
        <ArchiveDialog
          targets={dialog.targets}
          dict={dict}
          pending={pending}
          onClose={() => setDialog(null)}
          onConfirm={() => run("archive", dialog.targets)}
        />
      ) : null}
    </MenuActionsContext.Provider>
  )
}
