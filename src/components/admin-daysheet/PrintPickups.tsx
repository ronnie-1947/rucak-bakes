import type { SheetOrder } from "@/lib/daysheet/queries"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type PrintPickupsProps = {
  /** Verified orders, by time. */
  orders: SheetOrder[]
  dict: DaySheetCopy
  itemTemplate: string
}

/** The printed collections table. A row never splits across pages; the last column is a square to tick by pen. */
export function PrintPickups({ orders, dict, itemTemplate }: PrintPickupsProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h1">{dict.collectTitle}</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y-2 border-print text-micro font-semibold uppercase">
            <th className="py-1 pr-2">{dict.printTable.time}</th>
            <th className="py-1 pr-2">{dict.printTable.name}</th>
            <th className="py-1 pr-2">{dict.printTable.phone}</th>
            <th className="py-1 pr-2">{dict.printTable.items}</th>
            <th className="py-1 pr-2 text-right">{dict.printTable.total}</th>
            <th className="py-1 text-center">{dict.printTable.tick}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="break-inside-avoid border-b border-print/40 align-top">
              <td className="py-2 pr-2 font-semibold tabular-nums">{order.time ?? dict.noTime}</td>
              <td className="py-2 pr-2 font-semibold">
                {order.name}
                {order.delivery ? ` ${dict.printDelivery}` : null}
              </td>
              <td className="py-2 pr-2 text-small whitespace-nowrap tabular-nums">{order.phoneDisplay}</td>
              <td className="py-2 pr-2 text-small">{order.lines.map((line) => fill(itemTemplate, { quantity: line.quantity, name: line.name })).join(", ")}</td>
              <td className="py-2 pr-2 text-right font-semibold tabular-nums">{formatPaise(order.totalPaise)}</td>
              <td className="py-2">
                <span aria-hidden className="mx-auto block size-5 border-2 border-print" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
