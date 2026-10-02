"use client"

import { useCallback, useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { OrderStatus } from "@/generated/prisma/enums"
import { useDismiss } from "@/hooks/useDismiss"
import { type ActionTarget, useOrderActions } from "@/hooks/useOrderActions"
import { canTransition } from "@/lib/orders/status"
import type { DetailCopy } from "./types"

type OrderMenuProps = {
  target: ActionTarget
  status: OrderStatus
  /** Plain-text summary for "Copy details" — built on the server. */
  copyText: string
  dict: DetailCopy
}

const itemBase = "flex min-h-11 w-full items-center gap-2 rounded-chip px-3 text-left"

const itemTones: Record<"normal" | "danger", string> = {
  normal: `${itemBase} hover:bg-sunken`,
  danger: `${itemBase} text-red hover:bg-red-soft`,
}

/** The ⋯ menu: Print, Copy details, and Cancel order while cancelling is still possible. */
export function OrderMenu({ target, status, copyText, dict }: OrderMenuProps) {
  const { request } = useOrderActions()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(root, open, close)

  return (
    <div ref={root} className="relative print:hidden">
      <button
        type="button"
        aria-label={dict.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-button border border-border hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
      >
        <Icon name="more" className="size-5" strokeWidth={3} />
      </button>
      {open ? (
        <div role="menu" className="absolute top-full right-0 z-30 mt-2 flex w-50 flex-col rounded-panel border border-border bg-background p-1 shadow-raised">
          <button
            type="button"
            role="menuitem"
            className={itemTones.normal}
            onClick={() => {
              setOpen(false)
              window.print()
            }}
          >
            <Icon name="print" className="size-4 text-muted" />
            {dict.print}
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemTones.normal}
            onClick={async () => {
              await navigator.clipboard.writeText(copyText)
              setCopied(true)
              setTimeout(() => {
                setCopied(false)
                setOpen(false)
              }, 900)
            }}
          >
            <Icon name="copy" className="size-4 text-muted" />
            {copied ? dict.copied : dict.copy}
          </button>
          {canTransition(status, OrderStatus.CANCELLED) ? (
            <button
              type="button"
              role="menuitem"
              className={itemTones.danger}
              onClick={() => {
                setOpen(false)
                request([target], OrderStatus.CANCELLED)
              }}
            >
              <Icon name="trash" className="size-4" />
              {dict.cancelOrder}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
