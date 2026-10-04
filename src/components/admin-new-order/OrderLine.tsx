import { Button } from "@/components/ui/Button"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"
import { Stepper } from "@/components/ui/Stepper"
import { Tag } from "@/components/ui/Tag"
import { MAX_LINE_QTY } from "@/lib/cart/cart"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { MoneyInput } from "./MoneyInput"
import type { FormCopy, FormLine } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type OrderLineProps = {
  line: FormLine
  form: NewOrderForm
  dict: FormCopy
}

/**
 * One line: the name (wrapping — a custom cake's name can be long), remove, then quantity, the unit price staff may change,
 * and the line's total. A custom price says so, with the menu's and a way back to it.
 */
export function OrderLine({ line, form, dict }: OrderLineProps) {
  const t = dict.newOrder.items
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col gap-1 pt-2">
        <span className="text-body font-medium break-words">{line.name}</span>
        {line.custom ? (
          <span className="flex flex-wrap items-center gap-x-2 text-small-admin text-muted tabular-nums">
            <Tag tone="warm">{t.customPrice}</Tag>
            <span>{fill(t.menuPrice, { price: formatPaise(line.menuPricePaise) })}</span>
            <Button variant="link" size="inline" onClick={() => form.resetPrice(line.id)}>
              {t.reset}
            </Button>
          </span>
        ) : null}
        {line.gone ? <span className="text-small-admin font-semibold text-red">{t.gone}</span> : null}
      </div>
      <button
        type="button"
        onClick={() => form.removeLine(line.id)}
        aria-label={fill(t.remove, { name: line.name })}
        className="grid size-11 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
      >
        <CloseIcon className="size-4.5" />
      </button>
      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Stepper
          value={line.quantity}
          min={1}
          max={MAX_LINE_QTY}
          onChange={(quantity) => form.setQuantity(line.id, quantity)}
          decreaseLabel={t.fewer}
          increaseLabel={t.more}
        />
        <span className="flex items-center gap-2">
          <MoneyInput
            value={line.price}
            onChange={(text) => form.setPrice(line.id, text)}
            label={fill(t.price, { name: line.name })}
            width="price"
            frame={line.custom ? "accent" : "valid"}
          />
          <span className="text-small-admin text-muted">{dict.priceUnits[line.unit]}</span>
        </span>
        <span className="ml-auto font-semibold tabular-nums">{formatPaise(line.totalPaise)}</span>
      </div>
    </li>
  )
}
