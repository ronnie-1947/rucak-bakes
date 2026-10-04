import { AddButton } from "./AddButton"
import { RefusalNotice } from "./RefusalNotice"
import { SummaryBody } from "./SummaryBody"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type SummaryCardProps = {
  form: NewOrderForm
  dict: FormCopy
}

/** From 768px: the summary and Add order as a card — after the form on the tablet, sticky beside it from 1280px. */
export function SummaryCard({ form, dict }: SummaryCardProps) {
  return (
    <section
      aria-labelledby="new-order-summary-title"
      className="hidden w-full max-w-160 min-w-0 flex-col gap-3 rounded-panel border border-border p-4 md:flex xl:sticky xl:top-6 xl:max-w-none 2xl:max-w-100"
    >
      <h2 id="new-order-summary-title" className="text-h2">
        {dict.newOrder.summary.title}
      </h2>
      <SummaryBody form={form} variant="card" dict={dict} />
      <RefusalNotice refusal={form.refusal} dict={dict.newOrder} />
      <AddButton form={form} placement="card" dict={dict.newOrder} />
    </section>
  )
}
