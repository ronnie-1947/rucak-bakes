"use client"

import { Button } from "@/components/ui/Button"
import { OrderStatus } from "@/generated/prisma/enums"
import { type ActionTarget, useOrderActions } from "@/hooks/useOrderActions"
import { fill } from "@/lib/template"
import type { DetailCopy, DetailVariant } from "./types"

type ActionBarProps = {
  target: ActionTarget
  status: OrderStatus
  /** Shown above the buttons when verifying this pending order would pass the day's maxOrders. */
  overCapacity: { wouldBe: number; max: number; day: string } | null
  /** Shown instead of buttons once collected. */
  completedAt: string | null
  dict: DetailCopy
  variant: DetailVariant
}

/** The one next step, big, on the right; the way out (Cancel / No-show) beside it in red. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: OrderStatus.VERIFIED,
  VERIFIED: OrderStatus.READY,
  READY: OrderStatus.COMPLETED,
}

const EXIT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: OrderStatus.CANCELLED,
  VERIFIED: OrderStatus.CANCELLED,
  READY: OrderStatus.NO_SHOW,
}

const placements: Record<DetailVariant, string> = {
  page: "sticky bottom-0 z-20 -mx-4 px-4 pb-safe md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
  pane: "pb-4 px-4",
}

export function ActionBar({ target, status, overCapacity, completedAt, dict, variant }: ActionBarProps) {
  const { request, pending } = useOrderActions()
  const next = NEXT[status]
  const exit = EXIT[status]
  const nextKey = status as keyof DetailCopy["next"]

  if (completedAt) {
    return <p className={`border-t border-border pt-3 text-small-admin text-muted ${placements[variant]}`}>{fill(dict.completedLine, { at: completedAt })}</p>
  }
  if (!next) return null

  return (
    <div className={`flex flex-col gap-2 border-t border-border bg-background pt-3 shadow-raised print:hidden ${placements[variant]}`}>
      {overCapacity ? (
        <p role="status" className="rounded-panel border border-red bg-o50 px-3 py-2 text-small-admin font-semibold text-red">
          {fill(dict.overCapacity, { wouldBe: overCapacity.wouldBe, max: overCapacity.max, day: overCapacity.day })}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {exit ? (
          <Button variant="dangerOutline" disabled={pending} onClick={() => request([target], exit)}>
            {dict.secondary[nextKey]}
          </Button>
        ) : null}
        <Button variant="primary" disabled={pending} onClick={() => request([target], next)} className="min-w-44 flex-1 sm:flex-none">
          {dict.next[nextKey]}
        </Button>
      </div>
    </div>
  )
}
