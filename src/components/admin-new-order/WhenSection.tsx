import { useId } from "react"
import { Field } from "@/components/ui/Field"
import { Meter } from "@/components/ui/Meter"
import { Notice } from "@/components/ui/Notice"
import { SelectField } from "@/components/ui/SelectField"
import { inputClasses } from "@/components/ui/TextInput"
import { formatClock } from "@/lib/calendar/cutoffs"
import { formatLongDayLabel } from "@/lib/dates"
import { ADDRESS_MAX } from "@/lib/orders/checkout"
import { staffRoom } from "@/lib/orders/staff-order"
import { fill } from "@/lib/template"
import { warningText } from "./copy"
import { dayOptions } from "./days"
import { DayStrip } from "./DayStrip"
import { FormCard } from "./FormCard"
import { ModeChoice } from "./ModeChoice"
import { MoneyInput } from "./MoneyInput"
import type { FormCopy } from "./types"
import type { NewOrderForm } from "./useNewOrder"

type WhenSectionProps = {
  form: NewOrderForm
  dict: FormCopy
}

/**
 * Pickup or delivery, the day — with how full it is and why customers couldn't book it — then a pickup time from that
 * weekday's opening hours, or the delivery address and fee.
 */
export function WhenSection({ form, dict }: WhenSectionProps) {
  const timeId = useId()
  const addressId = useId()
  const feeId = useId()
  const w = dict.newOrder.when
  const { day } = form
  const options = dayOptions(form.page.window, form.lines, w)
  const dayWarnings = form.warnings.filter((warning) => warning.kind !== "prices")
  const full = day !== null && staffRoom(day) <= 0
  const dayLine = day
    ? day.isOpen
      ? fill(w.dayLine, { date: formatLongDayLabel(day.date), count: day.taken, max: day.maxOrders })
      : fill(w.dayLineClosed, { date: formatLongDayLabel(day.date) })
    : null
  const slots = form.date ? (form.page.slots[form.date] ?? []) : []

  return (
    <FormCard id="new-order-when" title={w.title}>
      <ModeChoice value={form.mode} onChange={form.setMode} dict={w} />
      <DayStrip options={options} selected={form.date} onSelect={form.setDate} label={w.date} caption={w.dotCaption} />
      {options.every((option) => option.look === "closed") ? (
        <Notice tone="quiet">{fill(w.noDays, { count: form.page.window.days.length })}</Notice>
      ) : null}
      {dayLine ? (
        <div className="flex flex-col gap-2">
          <span className="font-semibold tabular-nums">{dayLine}</span>
          {day?.isOpen ? <Meter value={day.taken} max={day.maxOrders} tone={full ? "full" : "warm"} label={dayLine} /> : null}
        </div>
      ) : null}
      {dayWarnings.map((warning, index) => (
        <Notice key={index} tone="warm">
          {warningText(warning, form.page.window.timeZone, dict.newOrder)}
        </Notice>
      ))}
      {form.delivery ? (
        <>
          <Field id={addressId} label={w.address}>
            <textarea
              id={addressId}
              rows={2}
              value={form.address}
              maxLength={ADDRESS_MAX}
              placeholder={w.addressPlaceholder}
              onChange={(event) => form.setAddress(event.target.value)}
              className={inputClasses(false, "resize-y py-2")}
            />
          </Field>
          <Field id={feeId} label={w.fee}>
            <MoneyInput id={feeId} value={form.fee} onChange={form.setFee} width="fee" />
          </Field>
        </>
      ) : (
        <Field id={timeId} label={w.time}>
          <SelectField
            id={timeId}
            value={form.time}
            onChange={(event) => form.setTime(event.target.value)}
            options={[{ value: "", label: w.anyTime }, ...slots.map((slot) => ({ value: slot, label: formatClock(slot) }))]}
            className="max-w-60"
          />
        </Field>
      )}
    </FormCard>
  )
}
