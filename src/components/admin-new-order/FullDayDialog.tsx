import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { formatWeekday } from "@/lib/dates"
import { fill } from "@/lib/template"
import type { NewOrderCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type FullDayDialogProps = {
  form: NewOrderForm
  dict: NewOrderCopy
}

/**
 * Add order on a full day — verified orders at max, or live orders at the overbook limit — or the server saying someone
 * took the last place meanwhile: name the counts, and let staff take one more. Add anyway resends with the same key.
 */
export function FullDayDialog({ form, dict }: FullDayDialogProps) {
  const f = dict.full
  const counts = form.fullCounts
  if (!form.date || !counts) return null
  const close = () => form.setDialog(null)
  return (
    <Dialog
      open={form.dialog === "full"}
      onClose={close}
      title={fill(f.title, { day: formatWeekday(form.date) })}
      closeLabel={f.close}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {f.back}
          </Button>
          <Button variant="primary" disabled={form.pending} onClick={() => form.submit(true)}>
            {form.pending ? dict.adding : f.ok}
          </Button>
        </>
      }
    >
      <p className="text-pretty tabular-nums">{fill(f.body, { count: counts.count, verified: counts.verified, max: counts.max })}</p>
    </Dialog>
  )
}
