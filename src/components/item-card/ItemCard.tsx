import Link from "next/link"
import type { IsoDate } from "@/lib/dates"
import type { Dict } from "@/lib/i18n"
import { itemHref } from "@/lib/storefront/routes"
import type { StoreItem } from "@/lib/storefront/types"
import { AddToCart } from "./AddToCart"
import { ItemPhoto } from "./ItemPhoto"
import { type ItemChip, type Offer, priceParts } from "./offer"

type ItemCardProps = {
  item: StoreItem
  /** What Add does. Omitted: no Add — a card that only links (the item page's "You might also like"). */
  offer?: Offer
  chip: ItemChip | null
  /** The day this card is about — the item page opens on it. */
  day?: IsoDate | null
  /** Not on today's or tomorrow's menu: 45% opacity and greyed — still opens the item's page. */
  muted?: boolean
  dict: Dict["store"]["item"]
  className?: string
}

const looks: Record<"muted" | "plain", string> = {
  muted: "opacity-45",
  plain: "",
}

/**
 * One item as a customer card (16px corners, 1px border, no shadow): photo with its chip, name, price, Add.
 * The name's link stretches over the whole card, so a tap anywhere opens /menu/[slug] (on the card's day); the
 * Add control sits above that layer.
 */
export function ItemCard({ item, offer, chip, day, muted = false, dict, className }: ItemCardProps) {
  const { price, unit } = priceParts(item, dict)
  return (
    <article
      className={`relative flex flex-col gap-3 rounded-card border border-border bg-background p-4 transition-transform duration-150 ease-out active:scale-99 motion-reduce:transition-none ${looks[muted ? "muted" : "plain"]} ${className ?? ""}`}
    >
      <ItemPhoto image={item.image} alt={item.imageAlt} chip={chip} muted={muted} />
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-body font-medium text-pretty">
          <Link
            href={itemHref(item.slug, day)}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-o700"
          >
            {item.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-1 tabular-nums">
          <span className="font-semibold text-o700">{price}</span>
          {unit ? <span className="text-small text-muted">{unit}</span> : null}
        </p>
      </div>
      {offer ? (
        <div className="mt-auto">
          <AddToCart name={item.name} offer={offer} dict={{ add: dict.add, addLabel: dict.addLabel, decrease: dict.decrease, increase: dict.increase }} />
        </div>
      ) : null}
    </article>
  )
}
