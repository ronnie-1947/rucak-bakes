import { type InputFrame, inputShellClasses } from "@/components/ui/TextInput"

type Width = "price" | "fee"

type MoneyInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  /** The accessible name when no visible label points at it — "Price for Custom birthday cake". */
  label?: string
  /** `price` 112px beside a line's stepper · `fee` 128px. */
  width: Width
  /** `accent` (the o500 border) while a line's price is custom. */
  frame?: InputFrame
}

const widths: Record<Width, string> = {
  price: "w-28",
  fee: "w-32",
}

/** A rupee amount behind a fixed "₹" cell, numeric keypad on phones. The text stays rupees; the form turns it into paise. */
export function MoneyInput({ id, value, onChange, label, width, frame = "valid" }: MoneyInputProps) {
  return (
    <div className={`shrink-0 ${widths[width]}`}>
      <div className={inputShellClasses(frame)}>
        <span aria-hidden className="grid w-7 shrink-0 place-items-center border-r border-border bg-sunken text-muted">
          ₹
        </span>
        <input
          id={id}
          value={value}
          inputMode="decimal"
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 tabular-nums outline-none"
        />
      </div>
    </div>
  )
}
