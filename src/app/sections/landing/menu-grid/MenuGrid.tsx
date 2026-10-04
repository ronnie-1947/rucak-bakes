import { catalogueCard } from "@/components/item-card/offer"
import { ItemCard } from "@/components/item-card/ItemCard"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { CatalogueItem, StoreDay } from "@/lib/storefront/types"

type MenuGridProps = {
  catalogue: CatalogueItem[]
  /** Today, then tomorrow — which of them each item's Add goes to. */
  days: StoreDay[]
  today: IsoDate
  dict: Dict["landing"]["menuGrid"]
  store: Dict["store"]
}

/**
 * "Everything we bake": every active item, in category order. Items on neither today's nor tomorrow's menu are
 * faded with "Not today" and when they're back, and still open their page. 2 / 3 / 4 columns.
 */
export function MenuGrid({ catalogue, days, today, dict, store }: MenuGridProps) {
  if (catalogue.length === 0) return null
  return (
    <section aria-labelledby="menu-grid" className="flex flex-col gap-3">
      <h2 id="menu-grid" className="text-h2">
        {dict.title}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {catalogue.map((entry) => {
          const card = catalogueCard(entry, days, today, store)
          return (
            <li key={entry.id} className="flex min-w-0">
              <ItemCard item={card.item} offer={card.offer} chip={card.chip} day={card.day} muted={card.muted} dict={store.item} className="w-full" />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
