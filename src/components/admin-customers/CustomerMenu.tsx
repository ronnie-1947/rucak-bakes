"use client"

import Link from "next/link"
import { useCallback, useId, useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { useCustomerActions } from "@/hooks/useCustomerActions"
import { useDismiss } from "@/hooks/useDismiss"
import type { FlagChange } from "@/lib/customers/changes"
import type { CustomerRow } from "@/lib/customers/queries"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"

type CustomerMenuProps = {
  customer: CustomerRow
  pageHref: string
  dict: AdminCopy
  /** Cards open it upward — their ⋯ sits at the bottom. */
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

/** The flag changes a customer allows — trusted and blocked never sit together, so each offers only its way back. */
function changesFor(customer: CustomerRow): FlagChange[] {
  if (customer.isBlocked) return ["unblock"]
  if (customer.isTrusted) return ["untrust"]
  return ["trust", "block"]
}

/** ⋯ on a card or row: View, then Mark trusted / Block — or the one way back for a flagged number. Each confirms first. */
export function CustomerMenu({ customer, pageHref, dict, direction = "down" }: CustomerMenuProps) {
  const { request, pending } = useCustomerActions()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(root, open, close)
  const target = { id: customer.id, name: customer.name, phoneDisplay: customer.phoneDisplay }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={fill(dict.customers.moreActions, { name: customer.name })}
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
          <Link href={pageHref} role="menuitem" className={itemTones.normal}>
            {dict.customers.view}
          </Link>
          {changesFor(customer).map((change) => (
            <button
              key={change}
              type="button"
              role="menuitem"
              className={itemTones[change === "block" ? "danger" : "normal"]}
              onClick={() => {
                setOpen(false)
                request(change, target)
              }}
            >
              {dict.customerActions[change]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
