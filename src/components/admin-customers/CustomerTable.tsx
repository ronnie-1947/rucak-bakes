import type { ReactNode } from "react"
import type { CustomersCopy } from "./types"

type CustomerTableProps = {
  dict: CustomersCopy
  children: ReactNode
}

const head = "px-2 py-2 text-micro font-semibold text-muted uppercase"

/** The 1024px+ table: Name · Phone · Orders · Last order · No-shows · Flags · actions. */
export function CustomerTable({ dict, children }: CustomerTableProps) {
  const t = dict.table
  return (
    <div className="overflow-hidden rounded-panel border border-border">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="border-b border-border bg-sunken">
          <tr>
            <th scope="col" className={`${head} w-auto pl-3`}>
              {t.name}
            </th>
            <th scope="col" className={`${head} w-40`}>
              {t.phone}
            </th>
            <th scope="col" className={`${head} w-18 text-right`}>
              {t.orders}
            </th>
            <th scope="col" className={`${head} w-24`}>
              {t.last}
            </th>
            <th scope="col" className={`${head} w-22 text-right`}>
              {t.noShows}
            </th>
            <th scope="col" className={`${head} w-40`}>
              {t.flags}
            </th>
            <th scope="col" className={`${head} w-28 pr-3`}>
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
