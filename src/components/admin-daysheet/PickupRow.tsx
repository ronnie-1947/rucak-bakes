"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import { useDaySheet } from "@/hooks/useDaySheet"
import type { SheetOrder } from "@/lib/daysheet/queries"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { DoneBox } from "./DoneBox"
import type { DaySheetCopy } from "./types"

type PickupRowProps = {
  order: SheetOrder
  dict: DaySheetCopy
  /** dict.admin.orders.items — "{quantity}× {name}". */
  itemTemplate: string
}

const dims: Record<"done" | "open", string> = {
  done: "opacity-60",
  open: "",
}

const notes: Record<"allergen" | "plain", string> = {
  allergen: "bg-red-soft text-red",
  plain: "bg-o50 text-foreground",
}

/**
 * One order at the counter: when, who (the code opens the order), every line, the number to call, the
 * customer's note, and the Collected tick. Pending orders show only when asked for, and can't be ticked.
 */
export function PickupRow({ order, dict, itemTemplate }: PickupRowProps) {
  const { isDone, toggle, readOnly } = useDaySheet()
  const done = !order.pending && isDone("collect", order.id)
  const dim = dims[done ? "done" : "open"]
  const items = order.lines.map((line) => fill(itemTemplate, { quantity: line.quantity, name: line.name })).join(", ")

  let when: string | null = null
  if (done && order.collected && order.collectedAt) when = fill(order.delivery ? dict.deliveredAt : dict.collectedAt, { time: order.collectedAt })
  else if (done) when = order.delivery ? dict.delivered : dict.collected

  return (
    <li className="grid min-h-18 grid-cols-[3.5rem_minmax(0,1fr)_auto_2.75rem] items-start gap-3 border-b border-border px-2 py-3 md:grid-cols-[4.5rem_minmax(0,1fr)_auto_2.75rem]">
      <span className={`pt-2 text-h2 font-semibold tabular-nums ${dim}`}>{order.time ?? dict.noTime}</span>

      <div className={`flex min-w-0 flex-col gap-1 ${dim}`}>
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="text-h2 font-medium">{order.name}</span>
          <Link
            href={`/admin/orders/${order.id}`}
            aria-label={fill(dict.openOrder, { code: order.code })}
            className="inline-flex min-h-11 items-center text-small text-muted tabular-nums hover:underline"
          >
            {order.code}
          </Link>
        </span>
        <span className="text-small">{items}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a
            href={`tel:${order.phoneE164}`}
            aria-label={fill(dict.callName, { name: order.name })}
            className="inline-flex min-h-11 items-center gap-1 text-small font-semibold text-o700 tabular-nums hover:underline"
          >
            <Icon name="phone" className="size-3.5" />
            {order.phoneDisplay}
          </a>
          {order.pending ? <Tag tone="warm">{dict.tags.pending}</Tag> : null}
          {order.delivery ? <Tag tone="neutral">{dict.tags.delivery}</Tag> : null}
          {order.note ? <Tag tone={order.allergen ? "red" : "warm"}>{order.allergen ? dict.tags.allergen : dict.tags.note}</Tag> : null}
          {order.trusted ? <Tag tone="green">{dict.tags.trusted}</Tag> : null}
        </span>
        {order.note ? <span className={`rounded-chip px-2 py-1 text-small font-semibold ${notes[order.allergen ? "allergen" : "plain"]}`}>{order.note}</span> : null}
        {order.address ? (
          <span className="flex flex-wrap items-center gap-x-2 text-small">
            <span>{order.address}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-o700 hover:underline"
            >
              {dict.openMaps}
            </a>
          </span>
        ) : null}
        {when ? <span className="text-small font-semibold text-green tabular-nums">{when}</span> : null}
      </div>

      <span className={`pt-2 text-right font-semibold text-o700 tabular-nums ${dim}`}>{formatPaise(order.totalPaise)}</span>

      {order.pending ? (
        <span />
      ) : (
        <DoneBox
          done={done}
          onToggle={() => toggle({ kind: "collect", id: order.id, label: order.name })}
          label={fill(order.delivery ? dict.markDelivered : dict.markCollected, { name: order.name })}
          disabled={readOnly}
        />
      )}
    </li>
  )
}
