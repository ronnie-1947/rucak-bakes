import { formatPaise } from "@/lib/money"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type ItemsTableProps = {
  order: Pick<OrderDetailData, "lines" | "subtotalPaise" | "deliveryFeePaise" | "totalPaise">
  dict: DetailCopy
}

/** The snapshot lines — names and prices as they were when ordered. Quantity is the largest number. */
export function ItemsTable({ order, dict }: ItemsTableProps) {
  const t = dict.itemsTable
  const head = "px-3 text-micro font-semibold text-muted uppercase"
  return (
    <div className="overflow-hidden rounded-panel border border-border">
      <table className="w-full table-fixed border-collapse tabular-nums">
        <thead className="bg-sunken">
          <tr className="h-10 border-b border-border">
            <th scope="col" className={`text-left ${head}`}>
              {t.item}
            </th>
            <th scope="col" className={`w-20 text-right ${head}`}>
              {t.unit}
            </th>
            <th scope="col" className={`w-16 text-right ${head}`}>
              {t.qty}
            </th>
            <th scope="col" className={`w-24 text-right ${head}`}>
              {t.line}
            </th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, index) => (
            <tr key={index} className="h-13 border-b border-border">
              <td className="px-3 font-medium">{line.name}</td>
              <td className="px-3 text-right text-muted">{formatPaise(line.unitPricePaise)}</td>
              <td className="px-3 text-right text-h2 font-semibold">{fill(dict.quantity, { quantity: line.quantity })}</td>
              <td className="px-3 text-right">{formatPaise(line.lineTotalPaise)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {order.deliveryFeePaise > 0 ? (
            <>
              <tr>
                <td colSpan={3} className="px-3 pt-3 text-right text-muted">
                  {dict.subtotal}
                </td>
                <td className="px-3 pt-3 text-right">{formatPaise(order.subtotalPaise)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 text-right text-muted">
                  {dict.deliveryFee}
                </td>
                <td className="px-3 text-right">{formatPaise(order.deliveryFeePaise)}</td>
              </tr>
            </>
          ) : null}
          <tr className="h-13">
            <td colSpan={3} className="px-3 text-right text-muted">
              {dict.total}
            </td>
            <td className="px-3 text-right text-h2 font-semibold text-o700">{formatPaise(order.totalPaise)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
