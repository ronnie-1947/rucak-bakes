import { Notice } from "@/components/ui/Notice"
import { Tag } from "@/components/ui/Tag"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { eachText, warningText, whenText } from "./copy"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type Variant = "card" | "sheet"

type SummaryBodyProps = {
  form: NewOrderForm
  /** `card` (beside or under the form) tags custom lines; `sheet` (phones) spells out each line's price instead. */
  variant: Variant
  dict: FormCopy
}

const names: Record<"set" | "unset", string> = {
  set: "font-semibold",
  unset: "font-semibold text-subtle",
}

/** The order as it will be added: who, when, each line, the fee, the total — and every warning again, so nothing is missed. */
export function SummaryBody({ form, variant, dict }: SummaryBodyProps) {
  const s = dict.newOrder.summary
  const timeZone = form.page.window.timeZone
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col tabular-nums">
        <span className={`break-words ${names[form.name.trim() ? "set" : "unset"]}`}>{form.name.trim() || s.noCustomer}</span>
        <span className="text-small-admin text-muted">{form.phoneValid ? fill(s.phone, { phone: form.phone }) : s.noPhone}</span>
        <span className="mt-1 text-small break-words">{whenText(form.date, form.mode, form.time, form.address, dict.newOrder)}</span>
      </div>
      <ul className="flex flex-col border-t border-border">
        {form.lines.map((line) => (
          <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-border py-2 text-small tabular-nums">
            <span className="break-words">{fill(s.line, { quantity: line.quantity, name: line.name })}</span>
            <span className="font-semibold">{formatPaise(line.totalPaise)}</span>
            {variant === "sheet" ? (
              <span className="col-span-2 text-small-admin text-muted">{eachText(line, dict)}</span>
            ) : line.custom ? (
              <Tag tone="warm" className="justify-self-start">
                {dict.newOrder.items.customPrice}
              </Tag>
            ) : null}
          </li>
        ))}
        {form.delivery ? (
          <li className="flex justify-between gap-3 border-b border-border py-2 text-small tabular-nums">
            <span className="text-muted">{s.fee}</span>
            <span>{formatPaise(form.feePaise)}</span>
          </li>
        ) : null}
      </ul>
      <div className="flex flex-col">
        <div className="flex items-baseline justify-between gap-3 tabular-nums">
          <span className="font-semibold">{variant === "sheet" ? s.totalAtPickup : s.total}</span>
          <span className="text-h2 font-semibold text-o700">{formatPaise(form.totalPaise)}</span>
        </div>
        {variant === "card" ? <span className="text-small-admin text-muted">{s.payAtPickup}</span> : null}
      </div>
      {form.warnings.map((warning, index) => (
        <Notice key={index} tone="warm">
          {warningText(warning, timeZone, dict.newOrder)}
        </Notice>
      ))}
    </div>
  )
}
