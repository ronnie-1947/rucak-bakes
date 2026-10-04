type ItemDetailsProps = {
  rows: { label: string; value: string }[]
  title: string
  className?: string
}

/** Label / value rows — size and storage, each only when the owner filled it in. Left out when neither is. */
export function ItemDetails({ rows, title, className }: ItemDetailsProps) {
  if (rows.length === 0) return null
  return (
    <section aria-labelledby="item-details" className={`flex max-w-2xl flex-col gap-1 ${className ?? ""}`}>
      <h2 id="item-details" className="mb-2 text-h2">
        {title}
      </h2>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-5 gap-4 border-t border-border py-3 first:border-t-0">
            <dt className="col-span-2 text-muted">{row.label}</dt>
            <dd className="col-span-3 text-pretty">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
