import { formatForDisplay } from "@/lib/phone"
import { fill } from "@/lib/template"
import type { StoreCopy } from "./copy"

/** The header's Call square, its label already written — formatted on the server, so libphonenumber stays out of the browser. */
export type HeaderCall = { phone: string; label: string }

/** E.164 → { phone, "Call +91 94357 09287" }, or null without a public phone. Server only (StoreShell). */
export function headerCall(phone: string | null, dict: StoreCopy["shell"]): HeaderCall | null {
  return phone ? { phone, label: fill(dict.call, { phone: formatForDisplay(phone) }) } : null
}
