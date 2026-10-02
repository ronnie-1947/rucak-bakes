"use client"

import { type ReactNode, useCallback, useMemo, useRef, useState, useTransition } from "react"
import { archiveMenuItems, duplicateMenuItem, type MenuChangeResult, restoreMenuItem, setMenuItemsActive, undoMenuChange } from "@/app/actions/menu"
import { type ItemTarget, type MenuActionKind, MenuActionsContext, type MenuActionsApi } from "@/hooks/useMenuActions"
import type { MenuSnapshot } from "@/lib/menu/changes"
import { targetsLabel } from "@/lib/menu/copy"
import { fill } from "@/lib/template"
import { ArchiveDialog } from "./ArchiveDialog"
import { DeactivateDialog } from "./DeactivateDialog"
import { MenuActionsStatus } from "./MenuActionsStatus"
import type { MenuCopy } from "./types"

type MenuActionsProviderProps = {
  dict: MenuCopy
  /** `top` renders the undo strip above the children; `manual` leaves it to a MenuActionsStatus inside them. */
  statusPlacement?: "top" | "manual"
  children: ReactNode
}

type OpenDialog = { kind: "deactivate" | "archive"; targets: ItemTarget[] }

type Undo = { text: string; snapshot: MenuSnapshot; link?: { href: string; label: string } }

/**
 * Owns every change on the menu library: the confirm dialogs, the server actions, and the green undo
 * strip each change leaves behind. Rows, cards, the ⋯ menu and the bulk bar call useMenuActions().request().
 * The actions revalidate, so the list refreshes itself.
 */
export function MenuActionsProvider({ dict, statusPlacement = "top", children }: MenuActionsProviderProps) {
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
      if (kind === "duplicate") return fill(changed.duplicated, { label: result.copy?.name ?? label })
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
        const link = result.copy ? { href: `/admin/menu/${result.copy.id}`, label: dict.openCopy } : undefined
        setUndo({ text: describe(kind, targets, result), snapshot: result.undo, link })
        onDoneRef.current?.()
      })
    },
    [describe, dict],
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

  const revert = useCallback(() => {
    if (!undo) return
    setFailed(false)
    startTransition(async () => {
      const result = await undoMenuChange(undo.snapshot)
      if (result.ok) setUndo(null)
      else setFailed(true)
    })
  }, [undo])

  const dismiss = useCallback(() => setUndo(null), [])

  const api = useMemo<MenuActionsApi>(
    () => ({ request, pending, status: { undo: undo ? { text: undo.text, link: undo.link } : null, failed, revert, dismiss } }),
    [request, pending, undo, failed, revert, dismiss],
  )

  return (
    <MenuActionsContext.Provider value={api}>
      {statusPlacement === "top" ? <MenuActionsStatus dict={dict} /> : null}
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
