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
import { CustomLines } from "./CustomLines"
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

/** The left edge lives on the first cell — under separate borders a <tr> draws none. New and current widen it in colour. */
const edges: Record<Look, string> = {
  current: "border-l-2 border-l-o700",
  new: "border-l-2 border-l-o500",
  plain: "border-l border-l-border",
}

const dims: Record<"full" | "dim", string> = { full: "", dim: "opacity-70" }

/** Columns that only fit when the split pane is closed. */
const wide: Record<"open" | "closed", string> = { open: "2xl:hidden", closed: "" }

/** With the pane open, Status is the last cell showing at 2xl — it takes the right edge. */
const statusEdges: Record<"open" | "closed", string> = { open: "2xl:border-r 2xl:border-r-border", closed: "" }

/** Every cell draws the row's bottom rule (OrderTable uses separate borders). Colours per side, so the first cell's edge keeps its own. */
const cell = "border-b border-b-border"

const DIMMED = ["COMPLETED", "CANCELLED", "NO_SHOW"]

export function OrderTableRow({ order, dict, selectMode, checked, onToggle, paneOpen, current }: OrderTableRowProps) {
  const look: Look = current ? "current" : order.isNew ? "new" : "plain"
  const dim = DIMMED.includes(order.status) || order.tags.suspected
  const pane = paneOpen ? "open" : "closed"
  const wideCell = `${cell} ${wide[pane]}`
  const target = { id: order.id, code: order.code, name: order.name }
  const linkClass = "font-semibold tracking-wide hover:underline"

  return (
    <tr className={`${looks[look]} ${dims[dim ? "dim" : "full"]}`}>
      <td className={`py-2 pr-2 pl-3 ${cell} ${edges[look]}`}>
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
      <td className={`px-2 py-2 ${cell}`}>{order.pickupTime ?? "—"}</td>
      <td className={`max-w-0 px-2 py-2 ${cell}`}>
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
        <CustomLines lines={order.customLines} dict={dict} className="block" />
      </td>
      <td className={`px-2 py-2 text-right font-semibold text-o700 ${cell}`}>{formatPaise(order.totalPaise)}</td>
      <td className={`max-w-0 px-2 py-2 ${wideCell}`}>
        <OrderTagList tags={order.tags} dict={dict.orderTags} compact className="flex-nowrap overflow-hidden" />
      </td>
      <td className={`px-2 py-2 ${cell} ${statusEdges[pane]}`}>
        <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
      </td>
      <td className={`border-r border-r-border py-2 pr-3 pl-2 ${wideCell}`}>
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
