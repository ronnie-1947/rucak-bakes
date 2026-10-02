"use client"

import { useState, useTransition } from "react"
import { applyToAllDays } from "@/app/actions/calendar"
import { Button } from "@/components/ui/Button"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"
import { SelectField } from "@/components/ui/SelectField"
import { Stepper } from "@/components/ui/Stepper"
import { cutoffKey, cutoffLabel, parseCutoffKey } from "@/lib/calendar/cutoffs"
import { MAX_ORDERS } from "@/lib/calendar/form"
import type { WeekPlan } from "@/lib/calendar/week"
import { formatDayNumber } from "@/lib/dates"
import { fill } from "@/lib/template"
import { cutoffSelectOptions } from "./copy"
import type { AdminCopy } from "./types"

type ApplyPanelProps = {
  week: WeekPlan
  dict: AdminCopy
  onClose: () => void
  /** The green line to show once it's applied. */
  onDone: (text: string) => void
}

/**
 * "Apply to all days": one Orders close and Max orders for every open day still ahead this week. Names the
 * days it changes, and any day that keeps a higher max because it already has more verified orders.
 */
export function ApplyPanel({ week, dict, onClose, onDone }: ApplyPanelProps) {
  const a = dict.calendar.apply
  const [cutoff, setCutoff] = useState(week.defaults.cutoff)
  const [max, setMax] = useState(week.defaults.maxOrders)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const days = week.days.filter((day) => !day.isPast && day.isOpen)
  const labels = days.map((day) => formatDayNumber(day.date))
  const keeps = days.filter((day) => day.verified > max)

  const apply = () => {
    setFailed(false)
    startTransition(async () => {
      const result = await applyToAllDays({ monday: week.monday, cutoff: cutoffKey(cutoff), maxOrders: max })
      if (!result.ok) {
        setFailed(true)
        return
      }
      const values = { cutoff: cutoffLabel(cutoff, dict.cutoffs, "long"), max, count: result.changed }
      onDone(fill(result.changed === 1 ? a.doneOne : a.done, values))
    })
  }

  return (
    <section aria-labelledby="apply-title" className="flex max-w-140 flex-col gap-3 rounded-panel border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="apply-title" className="font-sans text-body-admin font-semibold">
          {a.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={a.close}
          className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-small-admin text-muted">{a.ordersClose}</span>
          <SelectField
            value={cutoffKey(cutoff)}
            options={cutoffSelectOptions([cutoff], dict.cutoffs, "long")}
            onChange={(event) => {
              const next = parseCutoffKey(event.target.value)
              if (next) setCutoff(next)
            }}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-small-admin text-muted">{a.maxOrders}</span>
          <Stepper value={max} min={MAX_ORDERS.min} max={MAX_ORDERS.max} onChange={setMax} decreaseLabel={dict.calendar.fewer} increaseLabel={dict.calendar.more} />
        </div>
      </div>

      <p className="text-small-admin text-pretty text-muted tabular-nums">{days.length > 0 ? fill(a.days, { days: labels.join(", ") }) : a.noDays}</p>
      {keeps.map((day) => (
        <p key={day.date} className="text-small-admin text-red tabular-nums">
          {fill(a.keeps, { day: formatDayNumber(day.date), count: day.verified })}
        </p>
      ))}
      {failed ? (
        <p role="alert" className="text-small-admin text-red">
          {dict.calendar.failed}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {a.cancel}
        </Button>
        <Button variant="primary" className="tabular-nums" disabled={days.length === 0 || pending} onClick={apply}>
          {pending ? a.applying : days.length === 1 ? a.okOne : fill(a.ok, { count: days.length })}
        </Button>
      </div>
    </section>
  )
}
