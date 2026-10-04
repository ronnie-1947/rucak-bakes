type DateLegendProps = {
  /** "Too soon — needs 1 day’s notice" */
  soon: string
  closed: string
  full: string
}

/** What the grey, struck and red dates mean — always visible under the strip. */
export function DateLegend({ soon, closed, full }: DateLegendProps) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-small-admin text-muted">
      <li className="flex items-center gap-2">
        <span aria-hidden className="size-3 shrink-0 rounded-chip border border-border bg-sunken" />
        {soon}
      </li>
      <li className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid size-3 shrink-0 place-items-center rounded-chip border border-border bg-sunken text-micro text-subtle line-through"
        >
          5
        </span>
        {closed}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="size-3 shrink-0 rounded-chip border border-red-soft bg-red-soft" />
        {full}
      </li>
    </ul>
  )
}
