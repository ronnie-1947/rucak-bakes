"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { OrderStatus } from "@/generated/prisma/enums"
import { type ActionTarget, useOrderActions } from "@/hooks/useOrderActions"
import type { Dict } from "@/lib/i18n"
import { TRANSITIONS } from "@/lib/orders/status"

type StatusMenuProps = {
  target: ActionTarget
  status: OrderStatus
  /** Button text — "Update status" on cards, "Status" in the table. */
  label: string
  statusLabels: Dict["admin"]["orderStatus"]
  className?: string
}

const triggerTones: Record<"pending" | "other", string> = {
  pending: "border-o700 bg-o700 text-background hover:bg-o700/90",
  other: "border-border-strong bg-background text-foreground hover:bg-sunken",
}

const DESTRUCTIVE: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.NO_SHOW]

const itemTones: Record<"normal" | "destructive", string> = {
  normal: "",
  destructive: "mt-1 border-t border-border text-red",
}

/**
 * The per-order status dropdown. It offers only the moves the state machine allows — the current status
 * ticked, then the legal next ones, destructive ones last and in red. Terminal orders get no menu.
 */
export function StatusMenu({ target, status, label, statusLabels, className }: StatusMenuProps) {
  const { request, pending } = useOrderActions()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const next = TRANSITIONS[status]

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  if (next.length === 0) return null

  return (
    <div ref={root} className={`relative min-w-0 ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-button border px-3 font-semibold whitespace-nowrap transition-transform duration-150 ease-out active:scale-98 disabled:opacity-50 ${triggerTones[status === OrderStatus.PENDING ? "pending" : "other"]}`}
      >
        <span>{label}</span>
        <Icon name="chevronDown" className={`size-4 transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={menuId} role="menu" className="absolute top-full right-0 z-10 mt-2 flex w-50 flex-col rounded-panel border border-border bg-background p-1 shadow-raised">
          <div role="menuitemradio" aria-checked="true" aria-disabled="true" className="flex min-h-11 items-center gap-2 rounded-chip bg-o50 px-3 font-semibold">
            <CheckIcon className="size-4 shrink-0 text-o700" />
            <span>{statusLabels[status]}</span>
          </div>
          {next.map((to) => (
            <button
              key={to}
              type="button"
              role="menuitemradio"
              aria-checked="false"
              onClick={() => {
                setOpen(false)
                request([target], to)
              }}
              className={`flex min-h-11 items-center gap-2 rounded-chip px-3 text-left font-medium hover:bg-sunken ${itemTones[DESTRUCTIVE.includes(to) ? "destructive" : "normal"]}`}
            >
              <span aria-hidden className="w-4 shrink-0" />
              <span>{statusLabels[to]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
