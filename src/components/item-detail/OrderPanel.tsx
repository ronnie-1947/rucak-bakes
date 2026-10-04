"use client"

import { type ReactNode, useState } from "react"
import type { IsoDate } from "@/lib/dates"
import type { DayOption, OrderCopy } from "./availability"
import { AvailabilityLine } from "./AvailabilityLine"
import { OrderBar } from "./OrderBar"
import { PickupDays } from "./PickupDays"

type OrderPanelProps = {
  /** The name and description, rendered on the server (ItemTitle). */
  heading: ReactNode
  options: DayOption[]
  /** The day selected at first; null when no day has the item. */
  initial: IsoDate | null
  /** "₹240" — shown while no day is selected. */
  basePrice: string
  /** "per box", or "" for items sold each. */
  unit: string
  /** The item's name, for the steppers' labels. */
  name: string
  /** The bakery's phone, offered when the selected day is sold out. */
  call: { href: string; label: string } | null
  dict: OrderCopy
}

/**
 * Everything that changes with the pickup day: the price (a day can override it), the day chips, the
 * availability line with its bar, and Add to cart. Client only for which day is selected; every day's words
 * and numbers arrive worked out (availability.ts).
 */
export function OrderPanel({ heading, options, initial, basePrice, unit, name, call, dict }: OrderPanelProps) {
  const [selected, setSelected] = useState(initial)
  const day = options.find((option) => option.date === selected) ?? null
  const line = day?.line ?? dict.none

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {heading}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-h1 font-semibold text-o700">{day?.price ?? basePrice}</span>
          {unit ? <span className="text-small text-muted">{unit}</span> : null}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <PickupDays options={options} selected={selected} onSelect={setSelected} label={dict.pickupDay} />
        <AvailabilityLine line={line} tone={day?.tone ?? "muted"} meter={day?.meter ?? null} />
      </div>
      {/* Keyed by day: the quantity picked for one day doesn't carry to the next. */}
      <OrderBar key={selected ?? "none"} day={day} reason={line} name={name} call={call} dict={dict} />
    </div>
  )
}
