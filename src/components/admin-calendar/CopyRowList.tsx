type CopyRowListProps = {
  title: string
  rows: { date: string; label: string; text: string }[]
  /** Shown when there are no rows — "No days skipped". */
  empty?: string
  muted?: boolean
}

const texts: Record<"muted" | "plain", string> = {
  muted: "text-muted",
  plain: "",
}

/** A titled list of days in the copy dialog: "Mon 5 · Replaces 6 items with 7 items". */
export function CopyRowList({ title, rows, empty, muted = false }: CopyRowListProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-sans text-micro font-semibold text-muted uppercase">{title}</h3>
      {rows.length === 0 && empty ? <p className="border-t border-border py-2 text-small-admin text-muted">{empty}</p> : null}
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div key={row.date} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2 border-t border-border py-2 text-small-admin tabular-nums">
            <dt className="font-semibold">{row.label}</dt>
            <dd className={texts[muted ? "muted" : "plain"]}>{row.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
