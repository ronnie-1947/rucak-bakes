"use client"

import { type ReactNode, useState } from "react"
import type { IsoDate } from "@/lib/dates"
import type { DateOption, OrderCopy } from "./availability"
import { AvailabilityLine } from "./AvailabilityLine"
import { DateStrip } from "./DateStrip"
import { OrderBar } from "./OrderBar"

type OrderPanelProps = {
  /** The booking window's dates, judged for this item — at least one is open. */
  options: DateOption[]
  /** The date picked at first. */
  initial: IsoDate | null
  /** What the grey, struck and red dates mean — rendered on the server (DateLegend). */
  legend: ReactNode
  /** The item's name, for the steppers' labels. */
  name: string
  dict: OrderCopy
}

/**
 * Everything that changes with the pickup date: the strip, why a tapped date can't be had ("Fri 9 Oct · Fully booked"), the
 * picked date's line, and Add to cart. Client only for which date is picked; every date's words arrive worked out
 * (availability.ts).
 */
export function OrderPanel({ options, initial, legend, name, dict }: OrderPanelProps) {
  const [selected, setSelected] = useState(initial)
  const [refusal, setRefusal] = useState<string | null>(null)
  const day = options.find((option) => option.date === selected) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <DateStrip
          options={options}
          selected={selected}
          onSelect={(date) => {
            setRefusal(null)
            setSelected(date)
          }}
          onRefuse={setRefusal}
          label={dict.chooseDate}
        />
        {legend}
        {refusal ? (
          <p role="status" className="text-small font-semibold text-red">
            {refusal}
          </p>
        ) : null}
        {day ? <AvailabilityLine line={day.line} fewLeft={day.fewLeft} /> : null}
      </div>
      {/* Keyed by date: the quantity picked for one date doesn't carry to the next. */}
      <OrderBar key={selected ?? "none"} day={day} name={name} dict={dict} />
    </div>
  )
}
