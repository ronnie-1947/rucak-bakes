type CartSummaryProps = {
  /** Muted label / value lines above the total — Items, Delivery. */
  rows: { label: string; value: string }[]
  /** "Subtotal" on the cart step, "Total" once delivery is known. */
  totalLabel: string
  total: string
  /** "Pay at pickup — nothing is charged now." */
  pay: string
}

/** The money, display only — the server prices the order. */
export function CartSummary({ rows, totalLabel, total, pay }: CartSummaryProps) {
  return (
    <div className="flex flex-col gap-2 tabular-nums">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-3">
          <span className="text-muted">{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{totalLabel}</span>
        <span className="text-h2 font-semibold text-o700">{total}</span>
      </div>
      <p className="text-small text-pretty text-muted">{pay}</p>
    </div>
  )
}
