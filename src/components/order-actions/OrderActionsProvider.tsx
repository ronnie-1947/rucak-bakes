"use client"

import { type ReactNode, useCallback, useMemo, useRef, useState, useTransition } from "react"
import { transitionOrders } from "@/app/actions/orders"
import { Notice } from "@/components/ui/Notice"
import { OrderStatus } from "@/generated/prisma/enums"
import { type ActionTarget, OrderActionsContext, type OrderActionsApi } from "@/hooks/useOrderActions"
import { fill } from "@/lib/template"
import { CapacityDialog } from "./CapacityDialog"
import { ReasonDialog } from "./ReasonDialog"
import type { OpenDialog, OrdersCopy } from "./types"

type OrderActionsProviderProps = {
  dict: OrdersCopy
  children: ReactNode
}

/** Nothing moves an order back to PENDING. */
type TargetStatus = Exclude<OrderStatus, "PENDING">

type Problem = { kind: "stale"; codes: string[] } | { kind: "invalid" } | null

/**
 * Owns every order status change on a screen: the confirm dialogs, the server action, and the inline
 * message when someone else got there first. Wrap the list (or the detail page) in it; anything inside
 * calls useOrderActions().request(). The server action revalidates the admin layout, so the screen
 * and the pending badge refresh themselves.
 */
export function OrderActionsProvider({ dict, children }: OrderActionsProviderProps) {
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [problem, setProblem] = useState<Problem>(null)
  const [pending, startTransition] = useTransition()
  const onDoneRef = useRef<(() => void) | undefined>(undefined)

  const run = useCallback((targets: ActionTarget[], to: TargetStatus, options: { force?: boolean; note?: string } = {}) => {
    setProblem(null)
    startTransition(async () => {
      const result = await transitionOrders({ ids: targets.map((target) => target.id), to, force: options.force ?? false, note: options.note ?? null })
      if (result.ok) {
        setDialog(null)
        onDoneRef.current?.()
        return
      }
      if (result.reason === "CAPACITY_EXCEEDED") {
        const overIds = new Set(result.over.flatMap((day) => day.ids))
        setDialog({ kind: "over", over: result.over, targets: targets.filter((target) => overIds.has(target.id)) })
        return
      }
      setDialog(null)
      setProblem(result.reason === "STALE" ? { kind: "stale", codes: result.codes } : { kind: "invalid" })
    })
  }, [])

  const request = useCallback<OrderActionsApi["request"]>(
    (targets, to, onDone) => {
      if (targets.length === 0 || to === OrderStatus.PENDING) return
      onDoneRef.current = onDone
      if (to === OrderStatus.CANCELLED) setDialog({ kind: "cancel", targets })
      else if (to === OrderStatus.NO_SHOW) setDialog({ kind: "noShow", targets })
      else run(targets, to)
    },
    [run],
  )

  const api = useMemo(() => ({ request, pending }), [request, pending])

  return (
    <OrderActionsContext.Provider value={api}>
      {problem ? (
        <Notice tone="error" className="mb-4">
          {problem.kind === "stale" ? fill(dict.stale, { codes: problem.codes.join(", ") }) : dict.invalid}
        </Notice>
      ) : null}
      {children}
      {dialog?.kind === "cancel" || dialog?.kind === "noShow" ? (
        <ReasonDialog
          key={dialog.kind}
          kind={dialog.kind}
          targets={dialog.targets}
          dict={dict.dialogs}
          pending={pending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => run(dialog.targets, dialog.kind === "cancel" ? OrderStatus.CANCELLED : OrderStatus.NO_SHOW, { note: reason })}
        />
      ) : null}
      {dialog?.kind === "over" ? (
        <CapacityDialog
          over={dialog.over}
          targets={dialog.targets}
          dict={dict.dialogs}
          pending={pending}
          onClose={() => setDialog(null)}
          onConfirm={() => run(dialog.targets, OrderStatus.VERIFIED, { force: true })}
        />
      ) : null}
    </OrderActionsContext.Provider>
  )
}
