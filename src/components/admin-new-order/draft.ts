import { MAX_PRICE_PAISE, toPaise } from "@/lib/money"

/** The form's money fields hold rupees as typed; these turn them into paise and back. Client-safe, pure. */

/** 120000 → "1200", 24050 → "240.50" — a price as the field shows it. */
export function rupees(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2)
}

/** The field's text in paise, or null when it's empty (the menu price, or no fee). */
export function parseRupees(text: string): number | null {
  if (!text.trim()) return null
  try {
    // "240." is a price still being typed.
    return toPaise(text.replace(/\.$/, ""))
  } catch {
    return null
  }
}

/** What a money field keeps of a keystroke: digits and one point, two decimals, never above MAX_PRICE_PAISE. */
export function cleanRupees(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
  const [whole, fraction] = cleaned.split(".")
  const kept = fraction === undefined ? whole.slice(0, 6) : `${whole.slice(0, 6)}.${fraction.slice(0, 2)}`
  const paise = parseRupees(kept)
  return paise !== null && paise > MAX_PRICE_PAISE ? rupees(MAX_PRICE_PAISE) : kept
}
