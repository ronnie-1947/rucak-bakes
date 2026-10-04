import { ItemCard } from "@/components/item-card/ItemCard"
import type { Dict } from "@/lib/i18n"
import type { StoreItem } from "@/lib/storefront/types"

type RelatedItemsProps = {
  items: StoreItem[]
  title: string
  dict: Dict["store"]["item"]
}

/**
 * "You might also like" — the menu's own cards, without Add (each opens its page). A snap-scrolling row that
 * bleeds to the screen edge on phones and tablets, four across from 1024px.
 */
export function RelatedItems({ items, title, dict }: RelatedItemsProps) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="item-related" className="flex flex-col gap-3">
      <h2 id="item-related" className="text-h2">
        {title}
      </h2>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 md:-mx-6 md:scroll-px-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {items.map((item) => (
          <li key={item.id} className="flex w-42 shrink-0 snap-start md:w-50 lg:w-auto">
            <ItemCard item={item} chip={null} dict={dict} className="w-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}
