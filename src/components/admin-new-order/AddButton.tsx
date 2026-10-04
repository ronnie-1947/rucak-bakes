import { Button } from "@/components/ui/Button"
import { addLabel } from "./copy"
import type { NewOrderCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type Placement = "card" | "bar"

type AddButtonProps = {
  form: NewOrderForm
  placement: Placement
  dict: NewOrderCopy
}

/** In the bar it takes its own width beside the total, and the whole row once it wraps under it. */
const widths: Record<Placement, string> = {
  card: "w-full",
  bar: "grow basis-auto",
}

/**
 * Add order — or, until the order can go, what's still missing ("Add a phone number" › "Add the name" › "Add an item" ›
 * "Pick an open day"), drawn neutral and disabled.
 */
export function AddButton({ form, placement, dict }: AddButtonProps) {
  return (
    <Button
      variant={form.missing ? "outline" : "primary"}
      size="lg"
      disabled={form.missing !== null || form.pending}
      onClick={() => form.submit(false)}
      className={`font-semibold ${widths[placement]}`}
    >
      {addLabel(form.missing, form.pending, dict)}
    </Button>
  )
}
