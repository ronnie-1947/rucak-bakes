"use client"

import Link from "next/link"
import { useCallback, useId, useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { useDismiss } from "@/hooks/useDismiss"
import { useMenuActions } from "@/hooks/useMenuActions"
import type { MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type ItemMenuProps = {
  item: MenuItemRow
  dict: MenuCopy
  /** Grid cards open it upward — their ⋯ sits at the bottom of the card. */
  direction?: "down" | "up"
}

const placements: Record<"down" | "up", string> = {
  down: "top-full mt-1",
  up: "bottom-full mb-1",
}

const itemBase = "flex min-h-11 w-full items-center rounded-chip px-3 text-left text-body-admin"

const itemTones: Record<"normal" | "danger", string> = {
  normal: `${itemBase} hover:bg-sunken`,
  danger: `${itemBase} text-red hover:bg-red-soft`,
}

/** The ⋯ menu on every item: Edit, Duplicate, and Archive (red, behind a confirm). */
export function ItemMenu({ item, dict, direction = "down" }: ItemMenuProps) {
  const { request, pending } = useMenuActions()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(root, open, close)
  const target = { id: item.id, name: item.name, upcoming: item.upcoming }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={fill(dict.moreActions, { name: item.name })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 disabled:opacity-50"
      >
        <Icon name="more" className="size-5" strokeWidth={3} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute right-0 z-30 flex w-45 flex-col rounded-panel border border-border bg-background p-1 shadow-raised ${placements[direction]}`}
        >
          <Link href={`/admin/menu/${item.id}`} role="menuitem" className={itemTones.normal}>
            {dict.edit}
          </Link>
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
