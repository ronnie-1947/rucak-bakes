import type { ReactNode } from "react"
import type { MenuCopy } from "./types"

type MenuTableProps = {
  dict: MenuCopy
  selectMode: boolean
  /** MenuTableRow elements. */
  children: ReactNode
}

/**
 * The list view from 1024px: a data table with a sunken header row. Columns size by the header's width classes.
 * Separate borders, drawn on the cells: the wrapper can't clip (a row's ⋯ menu hangs below it), so the header
 * cells round their own corners.
 */
export function MenuTable({ dict, selectMode, children }: MenuTableProps) {
  const t = dict.table
  const head =
    "border-b border-border bg-sunken first:rounded-tl-panel last:rounded-tr-panel px-2 text-left text-micro font-semibold whitespace-nowrap text-muted uppercase"

  return (
    <div className="rounded-panel border border-border">
      <table className="w-full table-fixed border-separate border-spacing-0 tabular-nums">
        <thead>
          <tr className="h-10">
            {selectMode ? <th scope="col" className={`w-11 pl-3 ${head}`} /> : null}
            <th scope="col" className={`w-20 pl-3 ${head}`}>
              <span className="sr-only">{t.photo}</span>
            </th>
            <th scope="col" className={head}>
              {t.name}
            </th>
            <th scope="col" className={`w-28 ${head}`}>
              {t.category}
            </th>
            <th scope="col" className={`w-20 ${head}`}>
              {t.notice}
            </th>
            <th scope="col" className={`w-28 text-right ${head}`}>
              {t.price}
            </th>
            <th scope="col" className={head}>
              {t.usage}
            </th>
            <th scope="col" className={`w-32 ${head}`}>
              {t.status}
            </th>
            <th scope="col" className={`w-14 pr-3 ${head}`}>
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
