import { Field } from "@/components/ui/Field"
import { SelectField } from "@/components/ui/SelectField"
import { Stepper } from "@/components/ui/Stepper"
import { Switch } from "@/components/ui/Switch"
import { TextInput } from "@/components/ui/TextInput"
import { cutoffKey, cutoffLabel, cutoffOptions, formatClock, parseCutoffKey } from "@/lib/calendar/cutoffs"
import type { DayEditorData } from "@/lib/calendar/day"
import { LIMITS, MAX_ORDERS, OVERBOOK_MAX } from "@/lib/calendar/form"
import { addDays, computeCutoffAt, formatLongDayLabel, formatWeekday } from "@/lib/dates"
import { fill } from "@/lib/template"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type DaySettingsProps = {
  data: DayEditorData
  editor: DayEditor
  dict: AdminCopy
}

/** While the day is closed, everything but the switch rests — dimmed and disabled, still readable. */
const resting: Record<"closed" | "open", string> = {
  closed: "opacity-45",
  open: "",
}

/**
 * The day's own settings, each with the line saying what it does: open or closed (and why, when closed),
 * when orders close (and how much earlier a long-notice item closes), how many orders to verify, the overbook limit,
 * and the note customers see.
 * One column on phones, 2×2 on the tablet, the sticky side column from 1024px.
 */
export function DaySettings({ data, editor, dict }: DaySettingsProps) {
  const s = dict.calendarDay.settings
  const { plan } = editor
  const state = plan.isOpen ? "open" : "closed"
  const cutoffDay = formatLongDayLabel(addDays(data.date, -plan.cutoff.daysBefore))
  const cutoffPassed = computeCutoffAt(data.date, plan.cutoff.time, plan.cutoff.daysBefore, data.timezone) <= new Date(data.now)
  const cutoffHelp = fill(cutoffPassed ? s.cutoffPassed : s.cutoffHelp, { time: formatClock(plan.cutoff.time), day: cutoffDay })
  // The deadline rule (orders/deadline.ts): an item needing more notice than the day's own cutoff closes that much earlier.
  const longest = !cutoffPassed && data.longestNotice && data.longestNotice.days > plan.cutoff.daysBefore ? data.longestNotice : null
  const noticeHelp = longest
    ? fill(s.noticeHelp, {
        name: longest.name,
        days: longest.days,
        weekday: formatWeekday(addDays(data.date, -longest.days)),
        time: formatClock(plan.cutoff.time),
      })
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 rounded-panel border border-border p-3 md:grid-cols-2 lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          <span className="text-small-admin text-muted">{s.status}</span>
          <Switch
            checked={plan.isOpen}
            onChange={() => editor.setOpen(!plan.isOpen)}
            stateLabel={plan.isOpen ? dict.calendarDay.open : dict.calendarDay.closed}
            label={fill(s.switchLabel, { day: data.title })}
            className="self-start"
          />
          <span className="text-small-admin text-muted">{plan.isOpen ? s.openHelp : s.closedHelp}</span>
          {plan.isOpen ? null : (
            <Field id="closure-note" label={s.closureNote} hint={s.closureNoteHint}>
              <TextInput
                id="closure-note"
                value={plan.closureNote}
                maxLength={LIMITS.closureNote}
                placeholder={s.closureNotePlaceholder}
                onChange={(event) => editor.setClosureNote(event.target.value)}
                aria-describedby="closure-note-message"
              />
            </Field>
          )}
        </div>

        <fieldset disabled={!plan.isOpen} className={`min-w-0 flex min-w-0 flex-col gap-2 transition-opacity duration-150 ease-out ${resting[state]}`}>
          <label htmlFor="cutoff" className="text-small-admin text-muted">
            {s.ordersClose}
          </label>
          <SelectField
            id="cutoff"
            value={cutoffKey(plan.cutoff)}
            options={cutoffOptions([plan.cutoff, editor.saved.cutoff]).map((choice) => ({ value: cutoffKey(choice), label: cutoffLabel(choice, dict.cutoffs, "long") }))}
            onChange={(event) => {
              const next = parseCutoffKey(event.target.value)
              if (next) editor.setCutoff(next)
            }}
            aria-describedby="cutoff-help"
          />
          <span id="cutoff-help" className="flex flex-col gap-1 text-small-admin text-pretty text-muted tabular-nums">
            <span>{cutoffHelp}</span>
            {noticeHelp ? <span>{noticeHelp}</span> : null}
          </span>
        </fieldset>

        <fieldset disabled={!plan.isOpen} className={`min-w-0 flex flex-col gap-2 transition-opacity duration-150 ease-out ${resting[state]}`}>
          <span id="max-label" className="text-small-admin text-muted">
            {s.maxOrders}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Stepper
              value={plan.maxOrders}
              min={MAX_ORDERS.min}
              max={MAX_ORDERS.max}
              onChange={editor.setMaxOrders}
              decreaseLabel={s.fewer}
              increaseLabel={s.more}
              describedBy="max-label max-help"
            />
            <span id="max-help" className="text-small-admin text-muted tabular-nums">
              {fill(s.verifiedSoFar, { count: data.verified })}
            </span>
          </div>
        </fieldset>

        <fieldset disabled={!plan.isOpen} className={`min-w-0 flex flex-col gap-2 transition-opacity duration-150 ease-out ${resting[state]}`}>
          <span id="overbook-label" className="text-small-admin text-muted">
            {s.overbook}
          </span>
          <Stepper
            value={plan.overbookLimit}
            min={plan.maxOrders}
            max={OVERBOOK_MAX}
            onChange={editor.setOverbook}
            decreaseLabel={s.lower}
            increaseLabel={s.raise}
            describedBy="overbook-label overbook-help"
          />
          <span id="overbook-help" className="text-small-admin text-pretty text-muted tabular-nums">
            {fill(s.overbookHelp, { over: plan.overbookLimit, max: plan.maxOrders })}
          </span>
        </fieldset>
      </div>

      <fieldset disabled={!plan.isOpen} className={`min-w-0 transition-opacity duration-150 ease-out ${resting[state]}`}>
        <Field id="public-note" label={s.publicNote} hint={s.publicNoteHint}>
          <TextInput
            id="public-note"
            value={plan.publicNote}
            maxLength={LIMITS.publicNote}
            placeholder={s.publicNotePlaceholder}
            onChange={(event) => editor.setPublicNote(event.target.value)}
            aria-describedby="public-note-message"
          />
        </Field>
      </fieldset>
    </div>
  )
}
