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

/** "4 counter-items (86 pieces)", or "no counter-items". */
export function counterText(data: Pick<DaySheetData, "counter" | "counterPieces">, dict: DaySheetCopy): string {
  if (data.counter.length === 0) return dict.noCounterItems
  const pieces = plural(data.counterPieces, dict.piecesOne, dict.pieces)
  return data.counter.length === 1 ? fill(dict.counterItemsOne, { pieces }) : fill(dict.counterItems, { count: data.counter.length, pieces })
}

/**
 * "6 orders · 23 ordered items · 4 counter-items (86 pieces) · first pickup 7:30am · last 12:30pm" — verified orders
 * only. The printout leaves the times out (`withTimes` false).
 */
export function summaryText(data: DaySheetData, dict: DaySheetCopy, withTimes = true): string {
  const orders = plural(data.verifiedCount, dict.ordersOne, dict.orders)
  const items = plural(data.itemCount, dict.itemsOne, dict.items)
  const counter = counterText(data, dict)
  if (withTimes && data.firstTime && data.lastTime && data.firstTime !== data.lastTime) {
    return fill(dict.summaryTimes, { orders, items, counter, first: data.firstTime, last: data.lastTime })
  }
  if (withTimes && data.firstTime) return fill(dict.summaryOneTime, { orders, items, counter, first: data.firstTime })
  return fill(dict.summary, { orders, items, counter })
}

/** Under the summary: what For orders counts — "All orders for this day are verified.", "Counter-items only — …". */
export function pendingLine(data: DaySheetData, dict: DaySheetCopy): string {
  if (data.orders.length === 0) return dict.counterOnly
  if (data.pendingCount === 0) return dict.allVerified
  if (data.params.pending) return dict.pendingShown
  const verified = plural(data.verifiedCount, dict.verifiedOrdersOne, dict.verifiedOrders)
  return data.pendingCount === 1
    ? fill(dict.pendingHiddenOne, { verified })
    : fill(dict.pendingHidden, { verified, pending: pendingText(data.pendingCount, dict) })
}
