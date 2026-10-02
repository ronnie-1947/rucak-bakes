"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { OrderStatus } from "@/generated/prisma/enums"
import { useOrderActions } from "@/hooks/useOrderActions"
import type { OrderGroupData } from "@/lib/orders/queries"
import { BulkBar } from "./BulkBar"
import { OrderCard } from "./OrderCard"
import { OrderGroupHeader } from "./OrderGroupHeader"
import { OrderTable } from "./OrderTable"
import { OrderTableRow } from "./OrderTableRow"
import type { AdminCopy, BoardOrder } from "./types"

type OrderBoardProps = {
  dict: AdminCopy
  groups: (Omit<OrderGroupData, "orders"> & { orders: BoardOrder[] })[]
  selectMode: boolean
  /** Where "done" goes after a bulk action — the same view without ?select. */
  exitSelectHref: string
  paneOpen: boolean
  currentId: string | null
}

/**
 * The day groups. Cards (one column, two from 768px) below 1024px, a table from 1024px. Holds the
 * bulk selection; status changes go through the OrderActionsProvider above it.
 */
export function OrderBoard({ dict, groups, selectMode, exitSelectHref, paneOpen, currentId }: OrderBoardProps) {
  const router = useRouter()
  const { request, pending } = useOrderActions()
  const [selected, setSelected] = useState<string[]>([])

  const all = groups.flatMap((group) => group.orders)
  const picked = all.filter((order) => selected.includes(order.id))
  const toTarget = (order: BoardOrder) => ({ id: order.id, code: order.code, name: order.name })
  const verifiable = picked.filter((order) => order.status === OrderStatus.PENDING)
  const cancellable = picked.filter((order) => order.status === OrderStatus.PENDING || order.status === OrderStatus.VERIFIED)
  const toggle = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]))
  const done = () => {
    setSelected([])
    router.replace(exitSelectHref, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {groups.map((group) => (
        <section key={group.date} className="flex flex-col gap-2">
          <OrderGroupHeader group={group} dict={dict.orders} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {group.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                dict={dict}
                selectMode={selectMode}
                checked={selected.includes(order.id)}
                onToggle={() => toggle(order.id)}
              />
            ))}
          </div>
          <div className="hidden lg:block">
            <OrderTable dict={dict.orders} paneOpen={paneOpen}>
              {group.orders.map((order) => (
                <OrderTableRow
                  key={order.id}
                  order={order}
                  dict={dict}
                  selectMode={selectMode}
                  checked={selected.includes(order.id)}
                  onToggle={() => toggle(order.id)}
                  paneOpen={paneOpen}
                  current={order.id === currentId}
                />
              ))}
            </OrderTable>
          </div>
        </section>
      ))}

      {selectMode ? (
        <BulkBar
          dict={dict.orders}
          selectedCount={selected.length}
          verifiable={verifiable.length}
          cancellable={cancellable.length}
          pending={pending}
          onVerify={() => request(verifiable.map(toTarget), OrderStatus.VERIFIED, done)}
          onCancel={() => request(cancellable.map(toTarget), OrderStatus.CANCELLED, done)}
        />
      ) : null}
    </div>
  )
}
