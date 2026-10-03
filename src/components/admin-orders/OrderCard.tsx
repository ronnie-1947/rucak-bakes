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
import { WhenLine } from "./WhenLine"

type OrderCardProps = {
  order: BoardOrder
  dict: AdminCopy
  selectMode: boolean
  checked: boolean
  onToggle: () => void
}

type Frame = "new" | "checked" | "plain"

const frames: Record<Frame, string> = {
  new: "border-border border-l-2 border-l-o500 pl-3",
  checked: "border-o700",
  plain: "border-border hover:border-border-strong",
}

const dims: Record<"full" | "dim", string> = {
  full: "",
  dim: "opacity-70",
}

const DIMMED = ["COMPLETED", "CANCELLED", "NO_SHOW"]

/**
 * One order on phones and tablets. The whole card opens the order (an overlay link); the phone number,
 * Call and the status menu sit above that overlay. In select mode the overlay is the checkbox instead.
 */
export function OrderCard({ order, dict, selectMode, checked, onToggle }: OrderCardProps) {
  const frame: Frame = checked ? "checked" : order.isNew ? "new" : "plain"
  const dim = DIMMED.includes(order.status) || order.tags.suspected
  const target = { id: order.id, code: order.code, name: order.name }

  return (
    <article className={`relative flex flex-col gap-1 rounded-panel border bg-background p-3 ${frames[frame]} ${dims[dim ? "dim" : "full"]}`}>
      {selectMode ? null : <Link href={order.links.page} aria-label={fill(dict.orders.open, { code: order.code })} className="absolute inset-0 rounded-panel" />}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {selectMode ? <SelectBox checked={checked} onChange={onToggle} label={fill(dict.orders.selectOrder, { code: order.code })} cover /> : null}
          <span className="text-small-admin font-semibold tracking-wide">{order.code}</span>
          {order.isNew ? <Tag tone="warm">{dict.orders.new}</Tag> : null}
        </div>
        <StatusBadge status={order.status} label={dict.orderStatus[order.status]} />
      </div>

      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate font-medium">{order.name}</span>
        <a href={`tel:${order.phoneE164}`} className="relative z-10 text-small-admin whitespace-nowrap text-muted hover:underline">
          {order.phoneDisplay}
        </a>
      </div>

      <ItemsLine lines={order.lines} dict={dict.orders} />

      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-o700">{formatPaise(order.totalPaise)}</span>
        <span className="text-small-admin text-muted">
          <WhenLine fulfilmentType={order.fulfilmentType} pickupTime={order.pickupTime} dict={dict.orders} />
        </span>
      </div>

      <OrderTagList tags={order.tags} dict={dict.orderTags} className="mt-1" />

      {selectMode ? null : (
        <div className="relative z-10 mt-2 grid grid-cols-2 gap-2">
          <a href={`tel:${order.phoneE164}`} className={buttonClasses("outlineLink", "md")}>
            <Icon name="phone" className="size-4" />
            <span>{dict.orders.call}</span>
          </a>
          <StatusMenu target={target} status={order.status} label={dict.orders.updateStatus} statusLabels={dict.orderStatus} />
        </div>
      )}
    </article>
  )
}
