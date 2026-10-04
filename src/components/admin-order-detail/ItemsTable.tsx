import { Tag } from "@/components/ui/Tag"
import { formatPaise } from "@/lib/money"
import type { OrderDetailData } from "@/lib/orders/queries"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type ItemsTableProps = {
  order: Pick<OrderDetailData, "lines" | "subtotalPaise" | "deliveryFeePaise" | "totalPaise">
  dict: DetailCopy
}

const prices: Record<"custom" | "menu", string> = {
  custom: "font-semibold text-o700",
  menu: "text-muted",
}

/**
 * The snapshot lines — names and prices as they were when ordered. Quantity is the largest number. A line staff priced by
 * hand says so, with the menu's price under its own.
 */
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
            <th scope="col" className={`w-24 text-right ${head}`}>
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
              <td className="px-3 py-2 font-medium">
                <span className="flex flex-col items-start gap-1">
                  <span className="break-words">{line.name}</span>
                  {line.menuPricePaise !== null ? <Tag tone="warm">{dict.customPrice}</Tag> : null}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="flex flex-col items-end">
                  <span className={prices[line.menuPricePaise !== null ? "custom" : "menu"]}>{formatPaise(line.unitPricePaise)}</span>
                  {line.menuPricePaise !== null ? (
                    <span className="text-micro text-muted">{fill(dict.menuPrice, { price: formatPaise(line.menuPricePaise) })}</span>
                  ) : null}
                </span>
              </td>
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
              {dict.totalAtPickup}
            </td>
            <td className="px-3 text-right text-h2 font-semibold text-o700">{formatPaise(order.totalPaise)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
