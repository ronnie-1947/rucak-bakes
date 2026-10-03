"use client"

import { Checkbox } from "@/components/ui/Checkbox"
import { fullRow } from "./layout"
import type { SettingsCopy } from "./types"

type FulfilmentFieldProps = {
  pickup: boolean
  delivery: boolean
  onChange: (ways: { pickup: boolean; delivery: boolean }) => void
  /** Both off — customers would have no way to get an order. */
  error?: string
  dict: SettingsCopy["ordering"]
}

const frames: Record<"invalid" | "valid", string> = {
  invalid: "border-red",
  valid: "border-border",
}

/** Pickup and Delivery, each with what it means. At least one stays on — the database insists too. */
export function FulfilmentField({ pickup, delivery, onChange, error, dict }: FulfilmentFieldProps) {
  return (
    <div role="group" aria-labelledby="fulfilment-label" className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
      <span id="fulfilment-label" className="text-small-admin text-muted">
        {dict.fulfilment}
      </span>
      <div className={`flex flex-col divide-y divide-border rounded-panel border px-3 ${frames[error ? "invalid" : "valid"]}`}>
        <Checkbox label={dict.pickup} hint={dict.pickupHint} checked={pickup} onChange={() => onChange({ pickup: !pickup, delivery })} />
        <Checkbox label={dict.delivery} hint={dict.deliveryHint} checked={delivery} onChange={() => onChange({ pickup, delivery: !delivery })} />
      </div>
      {error ? (
        <span role="alert" className="text-small-admin text-pretty text-red">
          {error}
        </span>
      ) : null}
    </div>
  )
}
