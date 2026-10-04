import { Button } from "@/components/ui/Button"
import { Stepper } from "@/components/ui/Stepper"
import { Tag } from "@/components/ui/Tag"
import { type InputFrame, inputShellClasses } from "@/components/ui/TextInput"
import type { EditorItem } from "@/lib/calendar/day"
import { DAY_QUANTITY, type ItemPlan, overridePaise } from "@/lib/calendar/form"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import type { DayCopy } from "./types"

type ItemControlsProps = {
  item: EditorItem
  plan: ItemPlan
  onQuantity: (quantity: number) => void
  onOverride: (text: string) => void
  onSoldOut: () => void
  dict: DayCopy["items"]
}

type OverrideLook = "invalid" | "active" | "none"

const overrideFrames: Record<OverrideLook, InputFrame> = {
  invalid: "invalid",
  active: "accent",
  none: "valid",
}

/**
 * A counter-item, opened: the quantity made (with the item's usual batch beside it), a price override for this day only,
 * and Sold out — the counter ran out; Fresh today says so and the quantity stays. Undo puts it back.
 */
export function ItemControls({ item, plan, onQuantity, onOverride, onSoldOut, dict }: ItemControlsProps) {
  const override = overridePaise(plan.override, item.basePricePaise)
  const look: OverrideLook = override === undefined ? "invalid" : override === null ? "none" : "active"
  const diff = typeof override === "number" ? override - item.basePricePaise : 0
  const qtyId = `qty-${item.id}`
  const priceId = `price-${item.id}`

  return (
    <div className="border-t border-border">
      <div className="grid items-start gap-3 p-3 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span id={`${qtyId}-label`} className="text-small-admin text-muted">
            {dict.quantity}
          </span>
          <Stepper
            id={qtyId}
            value={plan.quantity}
            min={DAY_QUANTITY.min}
            max={DAY_QUANTITY.max}
            onChange={onQuantity}
            decreaseLabel={dict.less}
            increaseLabel={dict.more}
            describedBy={`${qtyId}-label ${qtyId}-usual`}
          />
          <span id={`${qtyId}-usual`} className="text-small-admin text-muted tabular-nums">
            {fill(dict.usual, { count: item.defaultQuantity })}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={priceId} className="text-small-admin text-muted">
            {dict.priceOverride}
          </label>
          <div className={inputShellClasses(overrideFrames[look])}>
            <span aria-hidden className="grid w-8 shrink-0 place-items-center border-r border-border bg-sunken text-muted">
              ₹
            </span>
            <input
              id={priceId}
              value={plan.override}
              onChange={(event) => onOverride(event.target.value)}
              placeholder={String(item.basePricePaise / 100)}
              inputMode="decimal"
              aria-invalid={look === "invalid" || undefined}
              aria-describedby={`${priceId}-note`}
              className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none"
            />
          </div>
          <span id={`${priceId}-note`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small-admin text-muted tabular-nums">
            {look === "active" ? <Tag tone="accent">{dict.overrideTag}</Tag> : null}
            {look === "invalid" ? (
              <span className="text-red">{dict.overrideInvalid}</span>
            ) : look === "active" ? (
              fill(diff > 0 ? dict.overrideMore : dict.overrideLess, { diff: formatPaise(Math.abs(diff)), base: formatPaise(item.basePricePaise) })
            ) : (
              dict.overrideEmpty
            )}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-small-admin text-muted">{dict.quickAction}</span>
          <Button variant={plan.soldOut ? "outlineLink" : "outline"} className="self-start" aria-pressed={plan.soldOut} onClick={onSoldOut}>
            {plan.soldOut ? dict.undoSoldOut : dict.soldOut}
          </Button>
          <span className="text-small-admin text-muted">{plan.soldOut ? dict.soldOutOnHelp : dict.soldOutHelp}</span>
        </div>
      </div>
    </div>
  )
}
