/** What a menu item's price is per. `MenuItem.priceUnit` is a plain string column; this is its domain. Client-safe. */
export const priceUnits = ["EACH", "PER_BOX", "PER_KG", "PER_SLICE"] as const
export type PriceUnit = (typeof priceUnits)[number]

/** An unknown stored value reads as EACH rather than breaking the screen. */
export function asPriceUnit(value: string): PriceUnit {
  return (priceUnits as readonly string[]).includes(value) ? (value as PriceUnit) : "EACH"
}
