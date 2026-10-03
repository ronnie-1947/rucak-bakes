"use client"

import { type ReactNode, useCallback, useMemo, useState, useTransition } from "react"
import { setCustomerFlag, undoCustomerFlag } from "@/app/actions/customers"
import { type CustomerActionsApi, CustomerActionsContext, type CustomerTarget } from "@/hooks/useCustomerActions"
import type { FlagChange, FlagSnapshot } from "@/lib/customers/changes"
import { fill } from "@/lib/template"
import { CustomerActionsStatus } from "./CustomerActionsStatus"
import { FlagDialog } from "./FlagDialog"
import type { ActionsCopy } from "./types"

type CustomerActionsProviderProps = {
  dict: ActionsCopy
  autoVerifyTrusted: boolean
  /** `top` renders the undo strip above the children; `manual` leaves it to a CustomerActionsStatus inside them. */
  statusPlacement?: "top" | "manual"
  children: ReactNode
}

type Asked = { change: FlagChange; target: CustomerTarget }

/**
 * Owns every trust / block change: the confirm, the server action, and the green undo strip it leaves.
 * Cards, rows, the ⋯ menu and the record's switches call useCustomerActions().request(). The action
 * revalidates, so whatever shows the customer refreshes itself.
 */
export function CustomerActionsProvider({ dict, autoVerifyTrusted, statusPlacement = "top", children }: CustomerActionsProviderProps) {
  const [asked, setAsked] = useState<Asked | null>(null)
  const [undo, setUndo] = useState<{ text: string; snapshot: FlagSnapshot } | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const request = useCallback<CustomerActionsApi["request"]>((change, target) => {
    setFailed(false)
    setAsked({ change, target })
  }, [])

  const confirm = useCallback(() => {
    if (!asked) return
    startTransition(async () => {
      const result = await setCustomerFlag({ id: asked.target.id, change: asked.change })
      setAsked(null)
      if (!result.ok) {
        setFailed(true)
        return
      }
      setUndo({ text: fill(dict.done[asked.change], { name: asked.target.name }), snapshot: result.undo })
    })
  }, [asked, dict])

  const revert = useCallback(() => {
    if (!undo) return
    setFailed(false)
    startTransition(async () => {
      const result = await undoCustomerFlag(undo.snapshot)
      if (result.ok) setUndo(null)
      else setFailed(true)
    })
  }, [undo])

  const dismiss = useCallback(() => setUndo(null), [])

  const api = useMemo<CustomerActionsApi>(
    () => ({ request, pending, status: { undo: undo?.text ?? null, failed, revert, dismiss } }),
    [request, pending, undo, failed, revert, dismiss],
  )

  return (
    <CustomerActionsContext.Provider value={api}>
      {statusPlacement === "top" ? <CustomerActionsStatus dict={dict} /> : null}
      {children}
      {asked ? (
        <FlagDialog
          change={asked.change}
          target={asked.target}
          autoVerifyTrusted={autoVerifyTrusted}
          dict={dict}
          pending={pending}
          onClose={() => setAsked(null)}
          onConfirm={confirm}
        />
      ) : null}
    </CustomerActionsContext.Provider>
  )
}
