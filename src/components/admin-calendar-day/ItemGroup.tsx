import type { EditorItem } from "@/lib/calendar/day"
import { fill } from "@/lib/template"
import { ItemRow } from "./ItemRow"
import type { DayCopy } from "./types"
import type { DayEditor } from "./useDayEditor"

type ItemGroupProps = {
  name: string
  /** The rows the search and category leave visible. */
  items: EditorItem[]
  /** Every item in the category — for "3 of 4 on". */
  all: EditorItem[]
  editor: DayEditor
  dict: DayCopy["items"]
}

/**
 * One category: a header that sticks under the summary strip (and to the top from 1024px, where there's no
 * strip) with "3 of 4 on", then its rows.
 */
export function ItemGroup({ name, items, all, editor, dict }: ItemGroupProps) {
  const on = all.filter((item) => editor.plan.items[item.id]?.included).length
  return (
    <section className="flex flex-col gap-2">
      <h3 className="sticky top-11 z-10 -mx-4 flex h-9 items-center justify-between bg-background px-4 font-sans md:-mx-6 md:px-6 lg:top-0 lg:mx-0 lg:px-1">
        <span className="text-micro font-semibold text-muted uppercase">{name}</span>
        <span className="text-micro font-normal text-muted tabular-nums">{fill(dict.groupCount, { on, count: all.length })}</span>
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            plan={editor.plan.items[item.id]}
            expanded={editor.expanded.has(item.id)}
            onToggle={() => editor.toggleItem(item.id)}
            onExpand={() => editor.toggleExpanded(item.id)}
            onQuantity={(quantity) => editor.setQuantity(item.id, quantity)}
            onOverride={(text) => editor.setOverride(item.id, text)}
            onSoldOut={() => editor.toggleSoldOut(item.id)}
            dict={dict}
          />
        ))}
      </ul>
    </section>
  )
}
