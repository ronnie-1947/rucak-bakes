import type { SheetNote } from "@/lib/daysheet/queries"
import { NoteCard } from "./NoteCard"
import type { DaySheetCopy } from "./types"

type NotesPanelProps = {
  /** Already narrowed to the orders this view shows; allergen notes first. */
  notes: SheetNote[]
  dict: DaySheetCopy
  className?: string
}

/** "Notes and allergies — read before you start." Every customer note for the day, in one place. */
export function NotesPanel({ notes, dict, className }: NotesPanelProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-2 ${className ?? ""}`}>
      <div className="flex flex-col">
        <h2 className="text-h2">{dict.notesTitle}</h2>
        <span className="text-small text-muted">{dict.notesHint}</span>
      </div>
      {notes.length === 0 ? (
        <p className="text-muted">{dict.noNotes}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteCard key={note.orderId} note={note} dict={dict} />
          ))}
        </ul>
      )}
    </section>
  )
}
