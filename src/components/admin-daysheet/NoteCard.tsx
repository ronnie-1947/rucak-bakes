import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import type { SheetNote } from "@/lib/daysheet/queries"
import { fill } from "@/lib/template"
import type { DaySheetCopy } from "./types"

type NoteCardProps = {
  note: SheetNote
  dict: DaySheetCopy
}

type Tone = "allergen" | "plain"

const cards: Record<Tone, string> = {
  allergen: "border-red bg-red-soft",
  plain: "border-o200 bg-o50",
}

const icons: Record<Tone, string> = {
  allergen: "text-red",
  plain: "text-o700",
}

const texts: Record<Tone, string> = {
  allergen: "font-semibold",
  plain: "font-medium",
}

/** One customer note, as written. A note that names an allergen is red and says so in words. */
export function NoteCard({ note, dict }: NoteCardProps) {
  const tone: Tone = note.allergen ? "allergen" : "plain"
  const when = note.time ?? (note.delivery ? dict.whenDelivery : dict.whenPickup)

  return (
    <li className={`grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 rounded-panel border p-3 ${cards[tone]}`}>
      <Icon name={note.allergen ? "alert" : "note"} className={`mt-0.5 size-5 ${icons[tone]}`} />
      <span className="flex flex-col">
        {note.allergen ? <span className="text-micro font-semibold text-red uppercase">{dict.allergen}</span> : null}
        <span className={`wrap-break-word ${texts[tone]}`}>{note.text}</span>
        <span className="flex flex-wrap items-center gap-2 text-small text-muted tabular-nums">
          {fill(dict.noteWho, { name: note.name, code: note.code, when })}
          {note.pending ? <Tag tone="warm">{dict.tags.pending}</Tag> : null}
        </span>
      </span>
    </li>
  )
}
