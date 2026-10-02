import { Tag, type TagTone } from "@/components/ui/Tag"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { DayEditorData } from "@/lib/calendar/day"
import { overridePaise } from "@/lib/calendar/form"
import { addDays, formatLongDayLabel } from "@/lib/dates"
import { fill } from "@/lib/template"
import { PreviewRow } from "./PreviewRow"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type DayPreviewProps = {
  data: DayEditorData
  editor: DayEditor
  dict: AdminCopy
}

type Availability = "closed" | "full" | "fast" | "available"

const tones: Record<Availability, TagTone> = {
  closed: "quiet",
  full: "red",
  fast: "warm",
  available: "green",
}

/** "Selling fast" with three or fewer orders left before the day shows as fully booked. */
const FAST_AT = 3

/**
 * From 1600px: the day as a customer would see it, with the unsaved edits in — status, the day note, each
 * item at its price for the day (sold out when nothing's left), and when ordering closes.
 */
export function DayPreview({ data, editor, dict }: DayPreviewProps) {
  const p = dict.calendarDay.preview
  const { plan } = editor
  const left = plan.overbookLimit - data.liveOrders.length
  const status: Availability = !plan.isOpen ? "closed" : left <= 0 ? "full" : left <= FAST_AT ? "fast" : "available"
  const items = data.items.filter((item) => plan.items[item.id]?.included)
  const note = plan.publicNote.trim()
  const orderBy = fill(p.orderBy, { time: formatClock(plan.cutoff.time), day: formatLongDayLabel(addDays(data.date, -plan.cutoff.daysBefore)) })

  return (
    <aside aria-labelledby="preview-title" className="sticky top-8 hidden min-w-0 flex-col gap-3 2xl:flex">
      <h2 id="preview-title" className="font-sans text-micro font-semibold text-muted uppercase">
        {p.title}
      </h2>
      <div className="overflow-hidden rounded-panel border border-border">
        <div className="border-b border-border p-3 font-display font-semibold">{data.bakeryName}</div>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-semibold tabular-nums">{fill(p.baking, { day: data.title })}</span>
            <Tag tone={tones[status]}>{p.status[status]}</Tag>
          </div>
          {note ? <p className="rounded-chip border border-o200 bg-o50 px-3 py-2 text-small-admin font-medium">{note}</p> : null}
          {plan.isOpen ? (
            <ul className="flex flex-col">
              {items.map((item) => (
                <PreviewRow
                  key={item.id}
                  name={item.name}
                  image={item.image}
                  pricePaise={overridePaise(plan.items[item.id].override, item.basePricePaise) ?? item.basePricePaise}
                  soldOut={plan.items[item.id].quantity <= (editor.ordered[item.id] ?? 0)}
                  soldOutLabel={p.soldOut}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-chip bg-sunken p-4 text-center text-small-admin text-muted">{p.closed}</p>
          )}
          <span className="text-small-admin text-muted tabular-nums">{orderBy}</span>
        </div>
      </div>
      <p className="text-small-admin text-muted">{p.hint}</p>
    </aside>
  )
}
