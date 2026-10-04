import { Icon } from "@/components/ui/icons/Icon"
import { formatPaise } from "@/lib/money"
import { fill } from "@/lib/template"
import { AddButton } from "./AddButton"
import { RefusalNotice } from "./RefusalNotice"
import type { NewOrderCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type SummaryBarProps = {
  form: NewOrderForm
  dict: NewOrderCopy
}

/**
 * Under 768px: the running total and Add order, stuck to the bottom of the scroll area just above the tab bar — always in
 * reach mid-call. The total opens the summary sheet.
 */
export function SummaryBar({ form, dict }: SummaryBarProps) {
  const s = dict.summary
  const total = formatPaise(form.totalPaise)
  return (
    <div className="sticky bottom-0 z-30 flex flex-col gap-2 border-t border-border bg-background px-4 py-2 shadow-raised md:hidden">
      <RefusalNotice refusal={form.refusal} dict={dict} />
      {/* One row while both fit; at 320px a long "Add a phone number" wraps to a full-width row of its own. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          aria-expanded={form.sheetOpen}
          onClick={() => form.setSheetOpen(true)}
          className="flex min-h-11 grow-999 basis-auto flex-col items-start justify-center rounded-button text-left focus-visible:outline-2 focus-visible:outline-o700"
        >
          <span className="flex items-center gap-1 font-semibold whitespace-nowrap tabular-nums">
            {form.itemCount === 1 ? fill(s.barOne, { total }) : fill(s.bar, { count: form.itemCount, total })}
            <Icon name="chevronDown" className="size-4 rotate-180 text-muted" />
          </span>
          <span className="text-micro text-muted">{s.details}</span>
        </button>
        <AddButton form={form} placement="bar" dict={dict} />
      </div>
    </div>
  )
}
