import type { ItemTarget } from "@/hooks/useMenuActions"
import { formatPaise } from "@/lib/money"
import type { ArchivedItemRow, MenuItemRow, ScheduledDay } from "@/lib/menu/queries"
import { fill } from "@/lib/template"
import type { MenuCopy, PriceUnitCopy } from "./types"

/** "₹240 each" */
export function priceText(item: Pick<MenuItemRow, "pricePaise" | "priceUnit">, dict: MenuCopy, units: PriceUnitCopy): string {
  return fill(dict.price, { price: formatPaise(item.pricePaise), unit: units[item.priceUnit] })
}

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

/** "Sat 3 Oct (today) · 4 ordered, Sun 4 Oct" — or "Not on any upcoming day". */
export function daysText(upcoming: ScheduledDay[], dict: MenuCopy["dialogs"]): string {
  if (upcoming.length === 0) return dict.notScheduled
  return upcoming
    .map((day) => {
      const label = day.isToday ? fill(dict.today, { day: day.dayLabel }) : day.dayLabel
      return day.ordered > 0 ? fill(dict.dayOrdered, { day: label, count: day.ordered }) : label
    })
    .join(", ")
}

/** One item by name, several by count — "Seeded rye" / "4 items". */
export function targetsLabel(targets: ItemTarget[], dict: MenuCopy): string {
  return targets.length === 1 ? targets[0].name : fill(dict.itemsLabel, { count: targets.length })
}
