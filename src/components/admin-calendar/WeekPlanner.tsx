"use client"

import { type ReactNode, useState } from "react"
import { Tag } from "@/components/ui/Tag"
import { UndoBar } from "@/components/ui/UndoBar"
import type { WeekPlan } from "@/lib/calendar/week"
import { ApplyPanel } from "./ApplyPanel"
import { CopyWeekDialog } from "./CopyWeekDialog"
import { DayCard } from "./DayCard"
import { EmptyWeek } from "./EmptyWeek"
import type { AdminCopy } from "./types"
import { WeekActions } from "./WeekActions"

type WeekPlannerProps = {
  week: WeekPlan
  /** The week navigation and numbers — rendered on the server. */
  nav: ReactNode
  dict: AdminCopy
}

/**
 * The week planner's moving parts: Copy last week and Apply to all days (and the green line each leaves),
 * then the seven day cards — or, for a week with nothing planned, a way to start. Past weeks are read-only.
 * Never a month grid: it can't carry per-day item counts and capacity bars.
 */
export function WeekPlanner({ week, nav, dict }: WeekPlannerProps) {
  const d = dict.calendar
  const [copyOpen, setCopyOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const editable = !week.isPastWeek
  const empty = editable && week.days.every((day) => !day.planned)
  const firstDay = week.days.find((day) => !day.isPast)?.date ?? week.monday
  const openCopy = () => {
    setApplyOpen(false)
    setCopyOpen(true)
  }
  const done = (text: string) => {
    setCopyOpen(false)
    setApplyOpen(false)
    setFlash(text)
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h1">{d.title}</h1>
          {editable ? <WeekActions layout="wide" applyOpen={applyOpen} onCopy={openCopy} onApply={() => setApplyOpen((open) => !open)} dict={d} /> : null}
        </div>
        {nav}
        {editable ? <WeekActions layout="narrow" applyOpen={applyOpen} onCopy={openCopy} onApply={() => setApplyOpen((open) => !open)} dict={d} /> : null}
        {editable ? null : (
          <Tag tone="quiet" className="self-start">
            {d.pastWeek}
          </Tag>
        )}
        {flash ? <UndoBar text={flash} dismissLabel={d.dismiss} onDismiss={() => setFlash(null)} /> : null}
        {editable && applyOpen ? <ApplyPanel week={week} dict={dict} onClose={() => setApplyOpen(false)} onDone={done} /> : null}
      </div>

      {empty ? (
        <EmptyWeek firstDay={firstDay} onCopy={openCopy} dict={d} />
      ) : (
        <ol className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-7 xl:gap-2">
          {week.days.map((day) => (
            <DayCard key={day.date} day={day} dict={dict} />
          ))}
        </ol>
      )}

      {editable && copyOpen ? <CopyWeekDialog week={week} dict={d} onClose={() => setCopyOpen(false)} onDone={done} /> : null}
    </div>
  )
}
