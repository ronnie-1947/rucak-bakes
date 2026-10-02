/** Fills `{name}` placeholders in a dict string: fill("Total {amount}", { amount: "₹800" }) → "Total ₹800". */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => (key in values ? String(values[key]) : placeholder))
}
