"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Tag } from "@/components/ui/Tag"
import type { CopySource, DayEditorData } from "@/lib/calendar/day"
import { fill } from "@/lib/template"
import { itemsText, namesPreview, unitsText } from "./copy"
import type { AdminCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type CopyDaySheetProps = {
  data: DayEditorData
  editor: DayEditor
  dict: AdminCopy
  onClose: () => void
}

/**
 * "Copy counter-items from another day": pick a nearby day's counter-items, then confirm what replacing does. It only
 * changes the form — nothing is saved until Save day. The day's orders aren't touched.
 */
export function CopyDaySheet({ data, editor, dict, onClose }: CopyDaySheetProps) {
  const c = dict.calendarDay.copy
  const [picked, setPicked] = useState<CopySource | null>(null)
  const includedNow = Object.values(editor.plan.items).filter((item) => item.included).length

  return (
    <Dialog
      open
      onClose={onClose}
      title={picked ? c.confirmTitle : c.title}
      closeLabel={c.close}
      footer={
        picked ? (
          <>
            <Button variant="outline" onClick={() => setPicked(null)}>
              {c.back}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                editor.applySource(picked)
                onClose()
              }}
            >
              {c.ok}
            </Button>
          </>
        ) : null
      }
    >
      {picked ? (
        <div className="flex flex-col gap-3">
          <p className="text-pretty tabular-nums">{fill(c.confirmBody, { day: data.title, source: picked.label })}</p>
          <ul className="flex flex-col text-small-admin tabular-nums">
            <li className="border-t border-border py-2">
              {fill(c.lineCount, { now: itemsText(includedNow, dict), then: itemsText(picked.items.length, dict), source: picked.label })}
            </li>
            <li className="border-t border-border py-2">{c.lineQuantities}</li>
            <li className="border-t border-border py-2">{c.lineOrdered}</li>
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-small-admin text-muted tabular-nums">{fill(c.intro, { day: data.title })}</p>
          {data.copySources.length === 0 ? <p className="text-muted">{c.none}</p> : null}
          <ul className="flex flex-col gap-2">
            {data.copySources.map((source) => (
              <li key={source.date}>
                <button
                  type="button"
                  onClick={() => setPicked(source)}
                  className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-panel border border-border bg-background px-3 py-2 text-left hover:border-border-strong hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{source.label}</span>
                      {source.tag ? <Tag tone="warm">{source.tag === "today" ? c.today : c.lastWeek}</Tag> : null}
                    </span>
                    <span className="truncate text-small-admin text-muted">{namesPreview(source.names, dict)}</span>
                  </span>
                  <span className="text-small-admin font-semibold whitespace-nowrap tabular-nums">
                    {fill(c.meta, {
                      items: itemsText(source.items.length, dict),
                      units: unitsText(
                        source.items.reduce((sum, item) => sum + item.quantity, 0),
                        dict,
                      ),
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  )
}
