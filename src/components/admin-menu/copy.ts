import type { ArchivedItemRow, MenuItemRow } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

/** "On the menu 4 days this week · 64 ordered this month" */
export function usageText(item: Pick<MenuItemRow, "daysThisWeek" | "orderedThisMonth">, dict: MenuCopy): string {
  const days =
    item.daysThisWeek === 0 ? dict.usageNone : item.daysThisWeek === 1 ? dict.usageDaysOne : fill(dict.usageDays, { count: item.daysThisWeek })
  return `${days} · ${fill(dict.usageOrdered, { count: item.orderedThisMonth })}`
}

/** "Archived Mon 12 Jan · 31 past orders still reference it" */
export function archivedMeta(item: ArchivedItemRow, dict: MenuCopy): string {
  const template = item.pastOrders === 0 ? dict.archivedMetaNone : item.pastOrders === 1 ? dict.archivedMetaOne : dict.archivedMeta
  return fill(template, { date: item.archivedLabel, count: item.pastOrders })
}
