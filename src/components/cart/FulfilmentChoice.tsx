import type { Fulfilment } from "./copy"

type FulfilmentChoiceProps = {
  legend: string
  value: Fulfilment
  /** Only what Settings switches on; `sub` is "Mill Lane, 7am–4pm" / "Within 3 km · ₹40 delivery". */
  options: { type: Fulfilment; title: string; sub: string | null }[]
  onChange: (type: Fulfilment) => void
}

const columns: Record<"one" | "two", string> = {
  one: "grid-cols-1",
  two: "grid-cols-2",
}

const subs: Record<"selected" | "plain", string> = {
  selected: "text-foreground",
  plain: "text-muted",
}

/**
 * Pickup or delivery, as two halves of one frame — native radios underneath, so arrow keys and screen readers
 * behave without help; the selected half takes the warm o500 fill.
 */
export function FulfilmentChoice({ legend, value, options, onChange }: FulfilmentChoiceProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-small-admin text-muted">{legend}</legend>
      <div className={`grid gap-2 rounded-button border border-border p-1 ${columns[options.length > 1 ? "two" : "one"]}`}>
        {options.map((option) => (
          <label
            key={option.type}
            className="flex min-h-14 min-w-0 cursor-pointer flex-col justify-center rounded-button px-3 py-2 has-checked:bg-o500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-o700"
          >
            <input
              type="radio"
              name="cart-fulfilment"
              value={option.type}
              checked={value === option.type}
              onChange={() => onChange(option.type)}
              className="sr-only"
            />
            <span className="font-semibold">{option.title}</span>
            {option.sub ? <span className={`text-small text-pretty ${subs[value === option.type ? "selected" : "plain"]}`}>{option.sub}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
