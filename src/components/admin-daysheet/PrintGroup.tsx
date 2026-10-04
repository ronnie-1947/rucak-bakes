/** One printed bake line. */
export type PrintLine = {
  key: string
  quantity: number
  name: string
  /** " (see note)" — an item on an order with a note. */
  mark?: string
  sub?: string
  /** "Meera BK-4821 · Anita BK-4815" */
  who?: string
  /** A Made to order line's note, in bold — "ALLERGY: " first when it names one. */
  note?: string
}

type PrintGroupProps = {
  title: string
  lines: PrintLine[]
}

/** One group on paper — a category, Made to order or the counter-items — never split across a page: 24pt quantities, a square to tick by pen. */
export function PrintGroup({ title, lines }: PrintGroupProps) {
  return (
    <section className="flex break-inside-avoid flex-col">
      <h3 className="border-b border-print pt-2 pb-1 font-sans text-small font-semibold uppercase">{title}</h3>
      <ul>
        {lines.map((line) => (
          <li
            key={line.key}
            className="grid min-h-14 break-inside-avoid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-4 border-b border-print/40 py-2"
          >
            <span className="text-glance font-semibold tabular-nums">{line.quantity}</span>
            <span className="flex flex-col">
              <span className="text-h2 font-semibold">
                {line.name}
                {line.mark}
              </span>
              {line.sub ? <span className="text-small">{line.sub}</span> : null}
              {line.who ? <span className="text-small tabular-nums">{line.who}</span> : null}
              {line.note ? <span className="font-bold">{line.note}</span> : null}
            </span>
            <span aria-hidden className="size-7 border-2 border-print" />
          </li>
        ))}
      </ul>
    </section>
  )
}
