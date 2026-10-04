import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import type { NewOrderCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type LeaveDialogProps = {
  form: NewOrderForm
  dict: NewOrderCopy["leave"]
}

/** Back (or View customer) with something entered. Keep editing is the safe default; Discard is red. */
export function LeaveDialog({ form, dict }: LeaveDialogProps) {
  const close = () => form.setDialog(null)
  return (
    <Dialog
      open={form.dialog === "leave"}
      onClose={close}
      title={dict.title}
      closeLabel={dict.close}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {dict.keep}
          </Button>
          <Button variant="danger" onClick={form.leave}>
            {dict.ok}
          </Button>
        </>
      }
    >
      <p className="text-pretty">{dict.body}</p>
    </Dialog>
  )
}
