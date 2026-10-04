import { Icon } from "@/components/ui/icons/Icon"
import { Tag, type TagTone } from "@/components/ui/Tag"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { DayEditorData } from "@/lib/calendar/day"
import { overridePaise } from "@/lib/calendar/form"
import { fill } from "@/lib/template"
import { PreviewRow } from "./PreviewRow"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type DayPreviewProps = {
  data: DayEditorData
  editor: DayEditor
  dict: AdminCopy
}

type Look = "counter" | "ordersOnly" | "closed"

const tones: Record<Look, TagTone> = {
  counter: "green",
  ordersOnly: "quiet",
  closed: "quiet",
}

/**
 * From 1600px: the day's Fresh today band as customers see it (§10R), unsaved edits included — "On the counter till 4pm"
 * (the opening hours' closing time that weekday), "Orders only" or "Closed"; the day note; each counter-item at its price
 * for the day, faded with Sold out when the counter ran out; then walk in or call.
 */
export function DayPreview({ data, editor, dict }: DayPreviewProps) {
  const p = dict.calendarDay.preview
  const { plan } = editor
  const items = data.items.filter((item) => plan.items[item.id]?.included)
  const look: Look = !plan.isOpen ? "closed" : items.length > 0 ? "counter" : "ordersOnly"
  const closes = data.counterCloses ? formatClock(data.counterCloses) : null
  const status = look === "counter" ? (closes ? fill(p.status.counter, { time: closes }) : p.status.counterAllDay) : p.status[look]
  const note = plan.publicNote.trim()
  const walkIn = data.phone ? p.walkIn : closes ? fill(p.walkInOnly, { time: closes }) : null

  return (
    <aside aria-labelledby="preview-title" className="sticky top-8 hidden min-w-0 flex-col gap-3 2xl:flex">
      <h2 id="preview-title" className="font-sans text-micro font-semibold text-muted uppercase">
        {p.title}
      </h2>
      <div className="overflow-hidden rounded-panel border border-border">
        <div className="border-b border-border p-3 font-display font-semibold">{data.bakeryName}</div>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-semibold">{p.fresh}</span>
            <Tag tone={tones[look]}>{status}</Tag>
          </div>
          {note ? <p className="rounded-chip border border-o200 bg-o50 px-3 py-2 text-small-admin font-medium">{note}</p> : null}
          {look === "counter" ? (
            <ul className="flex flex-col">
              {items.map((item) => (
                <PreviewRow
                  key={item.id}
                  name={item.name}
                  image={item.image}
                  pricePaise={overridePaise(plan.items[item.id].override, item.basePricePaise) ?? item.basePricePaise}
                  soldOut={plan.items[item.id].soldOut}
                  soldOutLabel={p.soldOut}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-chip bg-sunken p-4 text-center text-small-admin text-muted">{look === "closed" ? p.closed : p.empty}</p>
          )}
          {look === "closed" ? null : (
            <>
              {walkIn ? <span className="text-small-admin text-pretty text-muted">{walkIn}</span> : null}
              {data.phone ? (
                <span
                  className="flex min-h-11 items-center justify-center gap-2 rounded-button border border-o700 text-small font-semibold text-o700 tabular-nums"
                >
                  <Icon name="phone" className="size-4" />
                  {fill(p.call, { phone: data.phone })}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
      <p className="text-small-admin text-muted">{p.hint}</p>
    </aside>
  )
}
