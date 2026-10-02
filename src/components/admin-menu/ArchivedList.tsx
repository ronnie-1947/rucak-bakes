import { EmptyState } from "@/components/ui/EmptyState"
import type { ArchivedItemRow } from "@/lib/menu/queries"
import { archivedMeta } from "./copy"
import { ItemThumb } from "./ItemThumb"
import { RestoreButton } from "./RestoreButton"
import type { MenuCopy } from "./types"

type ArchivedListProps = {
  items: ArchivedItemRow[]
  dict: MenuCopy
}

/** ?archived=1 — every archived item, newest first, with how many past orders still name it and Restore. */
export function ArchivedList({ items, dict }: ArchivedListProps) {
  if (items.length === 0) return <EmptyState message={dict.emptyArchived} />

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="flex min-h-18 items-center gap-3 border-b border-border py-2">
          <ItemThumb images={item.images} muted />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{item.name}</span>
              {item.categoryName ? <span className="text-small-admin text-muted">{item.categoryName}</span> : null}
            </span>
            <span className="text-small-admin text-muted tabular-nums">{archivedMeta(item, dict)}</span>
          </div>
          <RestoreButton id={item.id} name={item.name} dict={dict} />
        </li>
      ))}
    </ul>
  )
}
