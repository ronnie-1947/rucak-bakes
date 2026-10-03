import type { SheetNote } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type PrintNotesProps = {
  notes: SheetNote[]
  dict: DaySheetCopy
}

/** The printed notes box — 2px border, read before baking. A note naming an allergen is bold and says so. */
export function PrintNotes({ notes, dict }: PrintNotesProps) {
  return (
    <section className="flex break-inside-avoid flex-col gap-2 border-2 border-print px-4 py-3">
      <h2 className="font-sans text-small font-semibold uppercase">{dict.printNotesTitle}</h2>
      <ul className="flex flex-col gap-2">
        {notes.map((note) => (
          <li key={note.orderId} className="flex flex-col border-t border-print pt-2">
            <span className={note.allergen ? "font-semibold" : "font-normal"}>
              {note.allergen ? <span className="uppercase">{dict.printAllergen} </span> : null}
              {note.text}
            </span>
            <span className="text-small tabular-nums">
              {fill(dict.noteWho, { name: note.name, code: note.code, when: note.time ?? (note.delivery ? dict.whenDelivery : dict.whenPickup) })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
