import type { PriceUnit } from "./units"

/**
 * The sizes a customer picks on the item page. A PER_KG item is ordered by weight — 0.5 kg, 1 kg, 1.5 kg … 5 kg — and each
 * piece is priced at its weight; everything else is ordered by count (1, 2, 3 …) at the base price. Client-safe, pure.
 */

export const WEIGHT_STEP_GRAMS = 500
export const MAX_WEIGHT_GRAMS = 5000

/** 500, 1000 … 5000. */
export const weightChoices: number[] = Array.from({ length: MAX_WEIGHT_GRAMS / WEIGHT_STEP_GRAMS }, (_, index) => (index + 1) * WEIGHT_STEP_GRAMS)

/** The few sizes a menu card offers — the usual orders. Every size is on the item page. */
export const cardWeights = [500, 1000, 1500, 2000]
export const cardCounts = [1, 2, 3, 4]

/** The size picked to start with, on a card and on the item page — the smallest, so Add to cart works at once. */
export function defaultSize(byWeight: boolean): number {
  return byWeight ? WEIGHT_STEP_GRAMS : 1
}

export function soldByWeight(unit: PriceUnit): boolean {
  return unit === "PER_KG"
}

/** One of the sizes the item page offers — the server takes no other. */
export function isWeightChoice(grams: number): boolean {
  return weightChoices.includes(grams)
}

/** The nearest size to a weight — an older cart line that counted kilos as its quantity. */
export function nearestWeight(grams: number): number {
  const stepped = Math.round(grams / WEIGHT_STEP_GRAMS) * WEIGHT_STEP_GRAMS
  return Math.min(MAX_WEIGHT_GRAMS, Math.max(WEIGHT_STEP_GRAMS, stepped))
}

/** One piece of `grams` at a per-kg price, to the paisa. */
export function sizedPrice(perKgPaise: number, grams: number): number {
  return Math.round((perKgPaise * grams) / 1000)
}

const kilograms = new Intl.NumberFormat("en-IN", { style: "unit", unit: "kilogram", maximumFractionDigits: 1 })

/** 1500 → "1.5 kg". */
export function formatWeight(grams: number): string {
  return kilograms.format(grams / 1000)
}

/** The order line's name snapshot: "Chocolate cake · 1.5 kg" for a by-weight line, else the name. */
export function sizedName(name: string, grams: number | null): string {
  return grams === null ? name : `${name} · ${formatWeight(grams)}`
}
