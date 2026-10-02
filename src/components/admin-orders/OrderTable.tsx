import type { ReactNode } from "react"
import type { OrdersCopy } from "./types"

type OrderTableProps = {
  dict: OrdersCopy
  paneOpen: boolean
  /** OrderTableRow elements. */
  children: ReactNode
}

const wide: Record<"open" | "closed", string> = { open: "2xl:hidden", closed: "" }

/** From 1024px: one table per day, sunken header row. Columns size by the header's width classes. */
export function OrderTable({ dict, paneOpen, children }: OrderTableProps) {
  const t = dict.table
  const wideCol = wide[paneOpen ? "open" : "closed"]
  const head = "px-2 text-left text-micro font-semibold whitespace-nowrap text-muted uppercase"

  return (
    <div className="overflow-hidden rounded-panel border border-border">
      <table className="w-full table-fixed border-collapse tabular-nums">
        <thead className="bg-sunken">
          <tr className="h-10 border-b border-border">
            <th scope="col" className={`w-36 pl-3 ${head}`}>
              {t.code}
            </th>
            <th scope="col" className={`w-16 ${head}`}>
              {t.time}
            </th>
            <th scope="col" className={head}>
              {t.customer}
            </th>
            <th scope="col" className={`w-32 ${head} ${wideCol}`}>
              {t.phone}
            </th>
            <th scope="col" className={`${head} ${wideCol}`}>
              {t.items}
            </th>
            <th scope="col" className={`w-20 text-right ${head}`}>
              {t.total}
            </th>
            <th scope="col" className={`w-36 ${head} ${wideCol}`}>
              {t.badges}
            </th>
            <th scope="col" className={`w-28 ${head}`}>
              {t.status}
            </th>
            <th scope="col" className={`w-44 pr-3 ${head} ${wideCol}`}>
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
