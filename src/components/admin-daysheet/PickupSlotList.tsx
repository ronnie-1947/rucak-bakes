import type { SheetOrder } from "@/lib/daysheet/queries"
import { PickupRow } from "./PickupRow"
import type { DaySheetCopy } from "./types"

type PickupSlotListProps = {
  /** "Morning", "Afternoon", "Any time", "Deliveries". */
  title: string
  orders: SheetOrder[]
  dict: DaySheetCopy
  itemTemplate: string
}

/** One part of the day at the counter, its orders in pickup-time order. */
export function PickupSlotList({ title, orders, dict, itemTemplate }: PickupSlotListProps) {
  return (
    <section className="flex flex-col">
      <h3 className="border-b border-border pt-3 pb-1 font-sans text-micro font-semibold text-muted uppercase">{title}</h3>
      <ul>
        {orders.map((order) => (
          <PickupRow key={order.id} order={order} dict={dict} itemTemplate={itemTemplate} />
        ))}
      </ul>
    </section>
  )
}
