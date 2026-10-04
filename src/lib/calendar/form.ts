import { type CutoffChoice, sameCutoff } from "@/lib/calendar/cutoffs"
import { priceToPaise } from "@/lib/menu/form"

/**
 * One day's plan as the day editor holds it — and the rules both the browser (status line, save bar) and
 * the save action (which re-checks everything against fresh rows) apply to it. Client-safe.
 */

export const LIMITS = { publicNote: 140, closureNote: 60 }
export const MAX_ORDERS = { min: 1, max: 200 }
/** A week card's Max orders stepper — the day editor keeps the full MAX_ORDERS. */
export const CARD_MAX_ORDERS = { min: 1, max: 30 }
/** overbookLimit ≥ maxOrders is a database CHECK (md_capacity_valid). */
export const OVERBOOK_MAX = 300
/** A counter-item's quantity made (§10R). */
export const DAY_QUANTITY = { min: 0, max: 99 }

/** One menu item as a counter-item of the day — ticked when it's baked for the counter. */
export type ItemPlan = {
  included: boolean
  /** Quantity made. */
  quantity: number
  /** Rupees as typed — "" means the item's base price. */
  override: string
  /** The counter ran out — `MenuDayItem.soldOutAt`. Fresh today shows it as sold out; the quantity stays. */
  soldOut: boolean
}

export type DayPlan = {
  isOpen: boolean
  cutoff: CutoffChoice
  maxOrders: number
  overbookLimit: number
  publicNote: string
  /** Why it's closed — staff-facing, shown on the week card. Only kept while the day is closed. */
  closureNote: string
  /** Every item the editor lists, keyed by menu item id — ticked (a counter-item) or not. */
  items: Record<string, ItemPlan>
}

/** A new max that would pass the overbook limit takes the limit with it — the database insists. */
export function withMaxOrders<T extends { maxOrders: number; overbookLimit: number }>(plan: T, maxOrders: number): T {
  return { ...plan, maxOrders, overbookLimit: Math.max(plan.overbookLimit, maxOrders) }
}

/** The price an override stores: null when empty or the same as the base. Undefined when it isn't a price. */
export function overridePaise(override: string, basePricePaise: number): number | null | undefined {
  if (!override.trim()) return null
  const paise = priceToPaise(override)
  if (paise === null) return undefined
  return paise === basePricePaise ? null : paise
}

/** How many things differ from the saved plan — each setting, and each item's tick, quantity, price or sold-out mark. */
export function changeCount(current: DayPlan, saved: DayPlan, basePrices: Record<string, number>): number {
  let count = 0
  if (current.isOpen !== saved.isOpen) count++
  if (!sameCutoff(current.cutoff, saved.cutoff)) count++
  if (current.maxOrders !== saved.maxOrders) count++
  if (current.overbookLimit !== saved.overbookLimit) count++
  if (current.publicNote.trim() !== saved.publicNote.trim()) count++
  if (!current.isOpen && current.closureNote.trim() !== saved.closureNote.trim()) count++
  for (const [id, item] of Object.entries(current.items)) {
    const before = saved.items[id]
    if (!before || item.included !== before.included) {
      count++
      continue
    }
    if (!item.included) continue
    if (item.quantity !== before.quantity) count++
    const base = basePrices[id] ?? 0
    if (overridePaise(item.override, base) !== overridePaise(before.override, base)) count++
    if (item.soldOut !== before.soldOut) count++
  }
  return count
}

/** Items whose typed override isn't a price. */
export function overrideProblems(plan: DayPlan, basePrices: Record<string, number>): string[] {
  return Object.entries(plan.items)
    .filter(([id, item]) => item.included && overridePaise(item.override, basePrices[id] ?? 0) === undefined)
    .map(([id]) => id)
}
