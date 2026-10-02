"use client"

import { useCallback, useId, useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { useDismiss } from "@/hooks/useDismiss"
import { type ItemTarget, useMenuActions } from "@/hooks/useMenuActions"
import type { ItemCopy } from "./types"

type ItemFormMenuProps = {
  target: ItemTarget
  dict: ItemCopy
}

const itemBase = "flex min-h-11 w-full items-center rounded-chip px-3 text-left"

const itemTones: Record<"normal" | "danger", string> = {
  normal: `${itemBase} hover:bg-sunken`,
  danger: `${itemBase} text-red hover:bg-red-soft`,
}

/** The header's ⋯ on a saved item: Duplicate (the copy starts inactive) and Archive (behind the confirm). */
export function ItemFormMenu({ target, dict }: ItemFormMenuProps) {
  const { request, pending } = useMenuActions()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(root, open, close)

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={dict.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-button border border-border hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 disabled:opacity-50"
      >
        <Icon name="more" className="size-5" strokeWidth={3} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 flex w-50 flex-col rounded-panel border border-border bg-background p-1 shadow-raised"
        >
          <button
            type="button"
            role="menuitem"
            className={itemTones.normal}
            onClick={() => {
              setOpen(false)
              request("duplicate", [target])
            }}
          >
            {dict.duplicate}
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemTones.danger}
            onClick={() => {
              setOpen(false)
              request("archive", [target])
            }}
          >
            {dict.archive}
          </button>
        </div>
      ) : null}
    </div>
  )
}
