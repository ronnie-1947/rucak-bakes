"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { type ItemTarget, useMenuActions } from "@/hooks/useMenuActions"
import type { MenuItemRow } from "@/lib/menu/queries"
import { BulkBar } from "./BulkBar"
import { MenuCard } from "./MenuCard"
import { MenuRow } from "./MenuRow"
import { MenuTable } from "./MenuTable"
import { MenuTableRow } from "./MenuTableRow"
import type { AdminCopy, ViewMode } from "./types"

type MenuBoardProps = {
  dict: AdminCopy
  items: MenuItemRow[]
  view: ViewMode
  selectMode: boolean
  /** Where "done" goes after a bulk action — the same view without ?select. */
  exitSelectHref: string
}

/** Which layouts a view renders, and the widths each shows at. Swapped by CSS, so there's no resize logic. */
const rowsShown: Record<ViewMode, string | null> = { auto: "md:hidden", list: "lg:hidden", grid: null }
const gridShown: Record<ViewMode, string | null> = { auto: "hidden md:grid", list: null, grid: "grid" }
const tableShown: Record<ViewMode, string | null> = { auto: null, list: "hidden lg:block", grid: null }

/**
 * The library's items. List view: rows below 1024px, a table from 1024px. Grid view: cards, two columns
 * on phones up to five at 1600px. With no ?view=, phones get the list and wider screens the grid.
 * Holds the bulk selection; changes go through the MenuActionsProvider above it.
 */
export function MenuBoard({ dict, items, view, selectMode, exitSelectHref }: MenuBoardProps) {
  const router = useRouter()
  const { request, pending } = useMenuActions()
  const [selected, setSelected] = useState<string[]>([])

  const picked = items.filter((item) => selected.includes(item.id))
  const toTarget = (item: MenuItemRow): ItemTarget => ({ id: item.id, name: item.name, upcoming: item.upcoming })
  const activatable = picked.filter((item) => !item.isActive)
  const deactivatable = picked.filter((item) => item.isActive)
  const toggle = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]))
  const done = () => {
    setSelected([])
    router.replace(exitSelectHref, { scroll: false })
  }
  const rowProps = (item: MenuItemRow) => ({ item, dict, selectMode, checked: selected.includes(item.id), onToggle: () => toggle(item.id) })

  return (
    <div className="flex flex-col">
      {rowsShown[view] ? (
        <div className={`flex flex-col ${rowsShown[view]}`}>
          {items.map((item) => (
            <MenuRow key={item.id} {...rowProps(item)} />
          ))}
        </div>
      ) : null}

      {gridShown[view] ? (
        <div className={`grid-cols-1 gap-3 xxs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${gridShown[view]}`}>
          {items.map((item) => (
            <MenuCard key={item.id} {...rowProps(item)} />
          ))}
        </div>
      ) : null}

      {tableShown[view] ? (
        <div className={tableShown[view]}>
          <MenuTable dict={dict.menu} selectMode={selectMode}>
            {items.map((item) => (
              <MenuTableRow key={item.id} {...rowProps(item)} />
            ))}
          </MenuTable>
        </div>
      ) : null}

      {selectMode ? (
        <BulkBar
          dict={dict.menu}
          selectedCount={picked.length}
          activatable={activatable.length}
          deactivatable={deactivatable.length}
          pending={pending}
          onActivate={() => request("activate", activatable.map(toTarget), done)}
          onDeactivate={() => request("deactivate", deactivatable.map(toTarget), done)}
          onArchive={() => request("archive", picked.map(toTarget), done)}
        />
      ) : null}
    </div>
  )
}
