/**
 * Money is always integer paise — ₹240 is 24000. No floats, no Decimal.
 * Convert at the edges (form input, display) and nowhere else.
 */

const RUPEES = /^(\d+)(?:\.(\d{1,2}))?$/

/** "240", "240.5", "₹1,200.50" or 240.5 → paise. Throws on anything else, including negatives. */
export function toPaise(rupees: number | string): number {
  if (typeof rupees === "number") {
    if (!Number.isFinite(rupees) || rupees < 0) throw new RangeError(`Not an amount: ${rupees}`)
    return Math.round(rupees * 100)
  }
  const match = RUPEES.exec(rupees.replace(/[₹,\s]/g, ""))
  if (!match) throw new RangeError(`Not an amount: "${rupees}"`)
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"))
}

const wholeRupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })
const withPaise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 24000 → "₹240", 24050 → "₹240.50", 10000000 → "₹1,00,000". Pair with `tabular-nums`. */
export function formatPaise(paise: number): string {
  const formatter = paise % 100 === 0 ? wholeRupees : withPaise
  return `₹${formatter.format(paise / 100)}`
}
