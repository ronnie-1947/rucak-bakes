import { Notice } from "@/components/ui/Notice"
import { fill } from "@/lib/template"
import { warningText } from "./copy"
import { FormCard } from "./FormCard"
import { MenuPicker } from "./MenuPicker"
import { OrderLine } from "./OrderLine"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type ItemsSectionProps = {
  form: NewOrderForm
  dict: FormCopy
}

/** The order's lines first — what matters — then the custom-price warning, then the menu to add from. */
export function ItemsSection({ form, dict }: ItemsSectionProps) {
  const t = dict.newOrder.items
  const count = form.lines.length
  const prices = form.warnings.find((warning) => warning.kind === "prices")

  return (
    <FormCard id="new-order-items" title={t.title} aside={count === 0 ? null : count === 1 ? t.linesOne : fill(t.lines, { count })}>
      {count === 0 ? (
        <p className="rounded-panel bg-sunken p-4 text-pretty text-muted">{t.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {form.lines.map((line) => (
            <OrderLine key={line.id} line={line} form={form} dict={dict} />
          ))}
        </ul>
      )}
      {prices ? <Notice tone="warm">{warningText(prices, form.page.window.timeZone, dict.newOrder)}</Notice> : null}
      <MenuPicker form={form} dict={dict} />
    </FormCard>
  )
}
