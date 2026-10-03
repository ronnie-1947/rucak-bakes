import type { CustomerRow } from "@/lib/customers/queries"
import { fill } from "@/lib/template"
import type { CustomersCopy } from "./types"

/** Dict strings for the customers list, filled. */

/** "12 orders · last on 3 Oct" */
export function historyText(row: CustomerRow, dict: CustomersCopy): string {
  if (row.orderCount === 0 || !row.lastOrderLabel) return dict.historyNone
  return fill(row.orderCount === 1 ? dict.historyOne : dict.history, { count: row.orderCount, date: row.lastOrderLabel })
}

/** "2 no-shows" — null when there are none. */
export function noShowsText(row: CustomerRow, dict: CustomersCopy): string | null {
  if (row.noShowCount === 0) return null
  return row.noShowCount === 1 ? dict.noShowsOne : fill(dict.noShows, { count: row.noShowCount })
}

/** Two or more no-shows: the row gets the red edge. */
export function isWarned(row: CustomerRow): boolean {
  return row.noShowCount >= 2
}
