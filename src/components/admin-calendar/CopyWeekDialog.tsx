"use client"

import { useState, useTransition } from "react"
import { copyLastWeek } from "@/app/actions/calendar"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Dialog } from "@/components/ui/Dialog"
import type { WeekPlan } from "@/lib/calendar/week"
import { fill } from "@/lib/template"
import { changeText, skipText } from "./copy"
import { CopyRowList } from "./CopyRowList"
import type { CalendarCopy } from "./types"

type CopyWeekDialogProps = {
  week: WeekPlan
  dict: CalendarCopy
  onClose: () => void
  /** The green line to show once it's copied. */
  onDone: (text: string) => void
}

/**
 * "Copy last week?" — says, day by day, what will change and what is skipped (past, has orders, nothing
 * planned) before anything is written. Counter-item quantities copy by default; price overrides and sold-out marks never.
 */
export function CopyWeekDialog({ week, dict, onClose, onDone }: CopyWeekDialogProps) {
  const c = dict.copy
  const [quantities, setQuantities] = useState(true)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const changes = week.copy.flatMap((row) => (row.change ? [{ date: row.date, label: row.label, text: changeText(row.change, dict) }] : []))
  const skips = week.copy.flatMap((row) => (row.skip ? [{ date: row.date, label: row.label, text: skipText(row.skip, dict) }] : []))
  const replacing = week.copy.filter((row) => (row.change?.before.items ?? 0) > 0).length
  const hasOrders = week.copy.some((row) => row.skip?.kind === "orders")

  const intro = [
    fill(c.intro, { range: week.previousRangeLabel }),
    replacing === 0 ? "" : replacing === 1 ? c.introReplaceOne : fill(c.introReplace, { count: replacing }),
    hasOrders ? c.introOrders : "",
  ]
    .filter(Boolean)
    .join(" ")

  const copy = () => {
    setFailed(false)
    startTransition(async () => {
      const result = await copyLastWeek({ monday: week.monday, quantities })
      if (!result.ok) {
        setFailed(true)
        return
      }
      const values = { range: week.previousRangeLabel, count: result.copied }
      onDone(result.copied === 0 ? c.doneNone : fill(result.copied === 1 ? c.doneOne : c.done, values))
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={c.title}
      closeLabel={c.close}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {c.cancel}
          </Button>
          <Button variant="primary" className="tabular-nums" disabled={changes.length === 0 || pending} onClick={copy}>
            {pending ? c.copying : changes.length === 0 ? c.nothing : changes.length === 1 ? c.okOne : fill(c.ok, { count: changes.length })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-pretty tabular-nums">{intro}</p>
        <Checkbox label={c.quantities} hint={c.quantitiesHint} checked={quantities} onChange={(event) => setQuantities(event.target.checked)} />
        <CopyRowList title={c.willChange} rows={changes} />
        <CopyRowList title={c.skipped} rows={skips} empty={c.noSkips} muted />
        <p className="text-small-admin text-muted">{c.inactiveNote}</p>
        {failed ? (
          <p role="alert" className="text-small-admin text-red">
            {dict.failed}
          </p>
        ) : null}
      </div>
    </Dialog>
  )
}
