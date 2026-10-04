import type { Dict } from "@/lib/i18n"
import type { ScheduledDay } from "@/lib/menu/queries"
import type { PriceUnit } from "@/lib/menu/units"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"

/** Dict strings for menu items, filled — shared by the menu list, the item form and their dialogs. Client-safe. */

type MenuCopy = Dict["admin"]["menu"]
type PriceUnitCopy = Dict["admin"]["priceUnits"]

/** "₹240 each" */
export function priceText(item: { pricePaise: number; priceUnit: PriceUnit }, dict: MenuCopy, units: PriceUnitCopy): string {
  return fill(dict.price, { price: formatPaise(item.pricePaise), unit: units[item.priceUnit] })
}

/** "Sat 3 Oct (today), Sun 4 Oct" — or "Not on the counter on any upcoming day". */
export function daysText(upcoming: ScheduledDay[], dict: MenuCopy["dialogs"]): string {
  if (upcoming.length === 0) return dict.notScheduled
  return upcoming.map((day) => (day.isToday ? fill(dict.today, { day: day.dayLabel }) : day.dayLabel)).join(", ")
}

/** One item by name, several by count — "Seeded rye" / "4 items". */
export function targetsLabel(targets: { name: string }[], dict: MenuCopy): string {
  return targets.length === 1 ? targets[0].name : fill(dict.itemsLabel, { count: targets.length })
}
