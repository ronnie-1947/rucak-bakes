import { ItemCard } from "@/components/item-card/ItemCard"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import type { CatalogueItem } from "@/lib/storefront/types"
import { CategoryFilter } from "./CategoryFilter"
import { addCopy, menuAction, menuChip } from "./copy"

type MenuProps = {
  catalogue: CatalogueItem[]
  /** The categories that have an item, in the bakery's order. */
  categories: { slug: string; name: string }[]
  /** E.164, or null — a card that can't be added to the cart then has no button, only its page. */
  phone: string | null
  /** Bakery-local — "For tomorrow" under a card's stepper. */
  today: IsoDate
  dict: Dict["landing"]["menu"]
  store: Dict["store"]
}

const ALL = "__all"
const OTHER = "__other"

/**
 * "Everything we bake" (§10R): every active item, in category order, under category chips. Each card carries its notice
 * chip, "On the counter today" when it is, and size chips with Add to cart (straight into the cart, for the earliest date it
 * can be had) or Call to order for a call-only item. Nothing fades — every item can be ordered ahead or called about.
 */
export function Menu({ catalogue, categories, phone, today, dict, store }: MenuProps) {
  if (catalogue.length === 0) return null
  const known = new Set(categories.map((category) => category.slug))
  const keyOf = (item: CatalogueItem) => (item.category && known.has(item.category) ? item.category : OTHER)
  const count = (key: string) => catalogue.filter((item) => keyOf(item) === key).length
  const filters = [
    { key: ALL, label: dict.all, count: catalogue.length },
    ...categories.map((category) => ({ key: category.slug, label: category.name, count: count(category.slug) })),
    ...(count(OTHER) > 0 ? [{ key: OTHER, label: dict.other, count: count(OTHER) }] : []),
  ]
  const add = addCopy(dict, store)

  return (
    <section aria-labelledby="menu" className="flex flex-col gap-3">
      <h2 id="menu" className="text-h2">
        {dict.title}
      </h2>
      <CategoryFilter
        label={dict.filterLabel}
        filters={filters}
        cards={catalogue.map((item) => ({
          id: item.id,
          key: keyOf(item),
          card: (
            <ItemCard
              item={item}
              chip={menuChip(item, store.notice)}
              tag={item.onCounter ? dict.onCounter : null}
              action={menuAction(item, phone, today, add, dict)}
              dict={store.item}
              className="w-full"
            />
          ),
        }))}
      />
    </section>
  )
}
