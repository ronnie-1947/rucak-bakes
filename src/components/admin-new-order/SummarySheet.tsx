import { Dialog } from "@/components/ui/Dialog"
import { SummaryBody } from "./SummaryBody"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type SummarySheetProps = {
  form: NewOrderForm
  dict: FormCopy
}

/** Phones: the bar's "Tap for details" — the whole order with each line's price, as a bottom sheet. */
export function SummarySheet({ form, dict }: SummarySheetProps) {
  const s = dict.newOrder.summary
  return (
    <Dialog open={form.sheetOpen} onClose={() => form.setSheetOpen(false)} title={s.title} closeLabel={s.close}>
      <SummaryBody form={form} variant="sheet" dict={dict} />
    </Dialog>
  )
}
