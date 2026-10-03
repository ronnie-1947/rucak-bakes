"use client"

import Link from "next/link"
import { StatusMenu } from "@/components/order-actions/StatusMenu"
import { OrderTagList } from "@/components/order-tag-list/OrderTagList"
import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { ItemsLine } from "@/components/ui/ItemsLine"
import { SelectBox } from "@/components/ui/SelectBox"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Tag } from "@/components/ui/Tag"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { AdminCopy, BoardOrder } from "./types"

type OrderTableRowProps = {
  order: BoardOrder
  dict: AdminCopy
  selectMode: boolean
  checked: boolean
  onToggle: () => void
  /** The split pane is open — the wide-only columns drop out at 2xl. */
  paneOpen: boolean
  /** This row is the order shown in the pane. */
  current: boolean
}

type Look = "current" | "new" | "plain"

const looks: Record<Look, string> = {
  current: "bg-o50",
  new: "hover:bg-sunken",
  plain: "hover:bg-sunken",
}

/** The left-edge marker lives on the first cell — a <tr> can't carry a border-left reliably. */
const edges: Record<Look, string> = {
  current: "border-l-2 border-l-o700",
  new: "border-l-2 border-l-o500",
  plain: "border-l-2 border-l-transparent",
}

const dims: Record<"full" | "dim", string> = { full: "", dim: "opacity-70" }

/** Columns that only fit when the split pane is closed. */
const wide: Record<"open" | "closed", string> = { open: "2xl:hidden", closed: "" }

const DIMMED = ["COMPLETED", "CANCELLED", "NO_SHOW"]

export function OrderTableRow({ order, dict, selectMode, checked, onToggle, paneOpen, current }: OrderTableRowProps) {
  const look: Look = current ? "current" : order.isNew ? "new" : "plain"
  const dim = DIMMED.includes(order.status) || order.tags.suspected
  const wideCell = wide[paneOpen ? "open" : "closed"]
  const target = { id: order.id, code: order.code, name: order.name }
  const linkClass = "font-semibold tracking-wide hover:underline"

  return (
    <tr className={`border-b border-border ${looks[look]} ${dims[dim ? "dim" : "full"]}`}>
      <td className={`py-2 pr-2 pl-3 ${edges[look]}`}>
        <span className="flex items-center gap-2">
          {selectMode ? <SelectBox checked={checked} onChange={onToggle} label={fill(dict.orders.selectOrder, { code: order.code })} /> : null}
          {/* Below 2xl the code opens the order's page; from 2xl it opens the split pane. */}
          <Link href={order.links.page} className={`${linkClass} 2xl:hidden`}>
            {order.code}
          </Link>
          <Link href={order.links.pane} scroll={false} className={`${linkClass} hidden 2xl:inline`}>
            {order.code}
          </Link>
          {order.isNew ? <Tag tone="warm">{dict.orders.new}</Tag> : null}
        </span>
      </td>
      <td className="px-2 py-2">{order.pickupTime ?? "—"}</td>
      <td className="max-w-0 px-2 py-2">
        <span className="flex flex-col">
          <span className="truncate font-medium">{order.name}</span>
          {paneOpen ? <ItemsLine lines={order.lines} dict={dict.orders} className="hidden text-small-admin text-muted 2xl:block" /> : null}
        </span>
      </td>
      <td className={`px-2 py-2 whitespace-nowrap ${wideCell}`}>
        <a href={`tel:${order.phoneE164}`} className="text-small-admin text-o700 hover:underline">
          {order.phoneDisplay}
        </a>
      </td>
      <td className={`max-w-0 px-2 py-2 ${wideCell}`}>
        <ItemsLine lines={order.lines} dict={dict.orders} className="block" />
      </td>
      <td className="px-2 py-2 text-right font-semibold text-o700">{formatPaise(order.totalPaise)}</td>
      <td className={`max-w-0 px-2 py-2 ${wideCell}`}>
        <OrderTagList tags={order.tags} dict={dict.orderTags} compact className="flex-nowrap overflow-hidden" />
      </td>
      <td className="px-2 py-2">
        <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
      </td>
      <td className={`py-2 pr-3 pl-2 ${wideCell}`}>
        {selectMode ? null : (
          <span className="flex justify-end gap-2">
            <a
              href={`tel:${order.phoneE164}`}
              aria-label={fill(dict.orders.callName, { name: order.name })}
              className={buttonClasses("outlineLink", "sm", "w-11 px-0")}
            >
              <Icon name="phone" className="size-4" />
            </a>
            <StatusMenu target={target} status={order.status} label={dict.orders.status} statusLabels={dict.orderStatus} className="w-28" />
          </span>
        )}
      </td>
    </tr>
  )
}
