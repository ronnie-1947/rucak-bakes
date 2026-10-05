"use client"

import { useRouter } from "next/navigation"
import { type MouseEvent, useState } from "react"
import { CloseDayDialog } from "@/components/close-day-dialog/CloseDayDialog"
import { Container } from "@/components/ui/Container"
import { Notice } from "@/components/ui/Notice"
import type { DayEditorData } from "@/lib/calendar/day"
import { fill } from "@/lib/template"
import { ClosedLine } from "./ClosedLine"
import { CopyDaySheet } from "./CopyDaySheet"
import { DayHeader } from "./DayHeader"
import { DayPreview } from "./DayPreview"
import { DaySettings } from "./DaySettings"
import { ItemPicker } from "./ItemPicker"
import { LeaveDialog } from "./LeaveDialog"
import { OrdersSection } from "./OrdersSection"
import { SaveBar } from "./SaveBar"
import { SaveCard } from "./SaveCard"
import type { AdminCopy } from "./types"
import { useDayEditor } from "./useDayEditor"

type DayEditorProps = {
  data: DayEditorData
  dict: AdminCopy
}

/** A closed day's item list rests: dimmed and disabled, still readable. */
const resting: Record<"closed" | "open", string> = {
  closed: "opacity-45",
  open: "",
}

/**
 * /admin/calendar/[date] (§10R): the day's orders, then its counter-items, then its settings — one column on phones and the
 * tablet (settings 2×2 there); from 1024px orders and counter-items take 62% beside a sticky settings column with Save;
 * from 1600px a customer preview of Fresh today joins as a third column. Past days are read-only.
 */
export function DayEditor({ data, dict }: DayEditorProps) {
  const router = useRouter()
  const d = dict.calendarDay
  const editor = useDayEditor(data)
  const [copyOpen, setCopyOpen] = useState(false)
  const [leaving, setLeaving] = useState<string | null>(null)

  const readOnly = data.isPast
  const state = editor.plan.isOpen ? "open" : "closed"
  const badge = !editor.saved.isOpen || (readOnly && !data.planned) ? (data.liveOrders.length > 0 ? "closedWithOrders" : "closed") : "open"
  const showBar = !readOnly && (editor.dirty || editor.saveState === "saved" || editor.problem !== null)
  const leave = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!editor.dirty) return
    event.preventDefault()
    setLeaving(href)
  }

  return (
    <div className="flex min-h-full flex-col">
      <Container className="flex flex-1 flex-col gap-4 pt-3 pb-12 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8">
        <DayHeader
          title={data.title}
          badge={badge}
          backHref={data.weekHref}
          prevHref={data.prevHref}
          nextHref={data.nextHref}
          onCopy={readOnly ? null : () => setCopyOpen(true)}
          onLeave={leave}
          dict={d}
        />
        {readOnly ? <Notice tone="quiet">{d.pastNote}</Notice> : null}

        <fieldset
          disabled={readOnly}
          className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-8 2xl:grid-cols-[minmax(0,45fr)_minmax(0,30fr)_minmax(0,25fr)]"
        >
          <div className="flex min-w-0 flex-col gap-6">
            {editor.plan.isOpen ? null : <ClosedLine text={fill(d.closedLine, { day: data.title })} />}
            <OrdersSection data={data} maxOrders={editor.plan.maxOrders} dict={dict} />
            <fieldset disabled={!editor.plan.isOpen} className={`min-w-0 transition-opacity duration-150 ease-out ${resting[state]}`}>
              <ItemPicker data={data} editor={editor} dict={dict} />
            </fieldset>
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8">
            <DaySettings data={data} editor={editor} dict={dict} />
            {readOnly ? null : <SaveCard editor={editor} dict={dict} />}
          </div>

          <DayPreview data={data} editor={editor} dict={dict} />
        </fieldset>
      </Container>

      {showBar ? <SaveBar editor={editor} dict={d.save} /> : null}

      {copyOpen ? <CopyDaySheet data={data} editor={editor} dict={dict} onClose={() => setCopyOpen(false)} /> : null}

      {leaving ? (
        <LeaveDialog day={data.title} changes={editor.changes} dict={d.leave} onClose={() => setLeaving(null)} onLeave={() => router.push(leaving)} />
      ) : null}

      {editor.closing ? (
        <CloseDayDialog
          day={data.title}
          orders={editor.closing}
          dict={dict.closeDay}
          pending={editor.pending}
          onClose={editor.cancelClose}
          onConfirm={editor.confirmClose}
        />
      ) : null}
    </div>
  )
}
