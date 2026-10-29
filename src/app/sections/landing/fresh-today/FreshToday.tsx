import { ItemCard } from "@/components/item-card/ItemCard"
import { Tag } from "@/components/ui/Tag"
import type { Dict } from "@/lib/i18n"
import type { FreshToday as FreshTodayData } from "@/lib/storefront/types"
import { freshLine, freshPill } from "./copy"

type FreshTodayProps = {
  fresh: FreshTodayData
  /** The walk-in line mentions calling only when the bakery has a public phone (the Call button sits under the hero). */
  hasPhone: boolean
  dict: Dict["landing"]["freshToday"]
  store: Dict["store"]
}

/**
 * "Fresh today" (§10R) — today's counter-items only: baked for the counter, walked in for, never ordered online. A status
 * pill, the walk-in line and the cards (each opens its item page; a sold-out one is faded with a red chip). The page leaves
 * the band out on a day with nothing on the counter.
 */
export function FreshToday({ fresh, hasPhone, dict, store }: FreshTodayProps) {
  const pill = freshPill(fresh, dict)
  return (
    <section aria-labelledby="fresh-today" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="fresh-today" className="text-h2">
          {dict.title}
        </h2>
        <Tag tone={pill.tone} size="pill">
          {pill.text}
        </Tag>
      </div>
      <p className="text-pretty">{freshLine(fresh, hasPhone, dict)}</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {fresh.items.map((item) => (
          <li key={item.id} className="flex min-w-0">
            <ItemCard
              item={item}
              chip={item.soldOut ? { text: store.item.soldOut, tone: "red" } : null}
              muted={item.soldOut}
              dict={store.item}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
