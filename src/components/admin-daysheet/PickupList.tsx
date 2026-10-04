import type { PickupSlot, SheetOrder } from "@/lib/daysheet/queries"
import { PickupSlotList } from "./PickupSlotList"
import { TickProgress } from "./TickProgress"
import type { DaySheetCopy } from "./types"

type PickupListProps = {
  /** Already narrowed to the orders this view shows. */
  orders: SheetOrder[]
  dict: DaySheetCopy
  itemTemplate: string
}

const SLOTS: PickupSlot[] = ["morning", "afternoon", "anytime", "delivery"]

/** "Collections": progress across verified orders, a column header from 1024px, then the day in slots. None: says so. */
export function PickupList({ orders, dict, itemTemplate }: PickupListProps) {
  const rows = orders.filter((order) => !order.pending).map((order) => ({ kind: "collect" as const, id: order.id }))

  if (orders.length === 0) {
    return (
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-h1">{dict.collectTitle}</h2>
        <p className="rounded-panel bg-sunken p-4 text-muted">{dict.noPickups}</p>
      </section>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-h1">{dict.collectTitle}</h2>
      <TickProgress rows={rows} template={dict.collectProgress} meterLabel={dict.collectProgressLabel} dict={dict} />
      <div
        aria-hidden
        className="hidden grid-cols-[4.5rem_minmax(0,1fr)_auto_2.75rem] gap-3 rounded-t-panel border border-border bg-sunken px-3 py-2 text-micro font-semibold text-muted uppercase lg:grid"
      >
        <span>{dict.table.time}</span>
        <span>{dict.table.customer}</span>
        <span className="text-right">{dict.table.total}</span>
        <span className="text-right">{dict.table.collected}</span>
      </div>
      {SLOTS.map((slot) => {
        const inSlot = orders.filter((order) => order.slot === slot)
        return inSlot.length > 0 ? <PickupSlotList key={slot} title={dict.slots[slot]} orders={inSlot} dict={dict} itemTemplate={itemTemplate} /> : null
      })}
    </section>
  )
}
