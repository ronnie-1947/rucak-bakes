import type { BakeRow, DaySheetData } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

/** Dict strings for the day sheet, filled. */

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : fill(many, { count })
}

/** "2 pending orders" / "1 pending order" */
export function pendingText(count: number, dict: DaySheetCopy): string {
  return plural(count, dict.pendingOrdersOne, dict.pendingOrders)
}

/**
 * What the bake total counts, under the item's name: "boxes · Box of 6", "kg". An item sold each says
 * nothing unless it has a size note — "2 Sourdough loaf" needs no "pieces".
 */
export function unitText(row: Pick<BakeRow, "unit" | "sizeNote">, dict: DaySheetCopy): string {
  const unit = row.unit === "EACH" ? null : dict.units[row.unit]
  return [unit, row.sizeNote].filter(Boolean).join(" · ")
}

/** "6 orders · 23 items · first pickup 07:30 · last pickup 12:00" — verified orders only. */
export function summaryText(data: DaySheetData, dict: DaySheetCopy): string {
  const orders = plural(data.verifiedCount, dict.ordersOne, dict.orders)
  const items = plural(data.itemCount, dict.itemsOne, dict.items)
  if (data.firstTime && data.lastTime && data.firstTime !== data.lastTime) {
    return fill(dict.summaryTimes, { orders, items, first: data.firstTime, last: data.lastTime })
  }
  if (data.firstTime) return fill(dict.summaryOneTime, { orders, items, first: data.firstTime })
  return fill(dict.summary, { orders, items })
}
