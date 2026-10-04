import Link from "next/link"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { Tag } from "@/components/ui/Tag"
import type { Dict } from "@/lib/i18n"
import { itemHref } from "@/lib/storefront/routes"
import type { StoreItem } from "@/lib/storefront/types"
import { type CardAction, type ItemChip, priceParts } from "./card"
import { ItemPhoto } from "./ItemPhoto"

type ItemCardProps = {
  item: StoreItem
  /** On the photo: "Order by tomorrow" (white), "Sold out" (red). */
  chip: ItemChip | null
  /** Faded — a counter-item that has sold out. Still opens its page. */
  muted?: boolean
  /** A green fact under the price — "On the counter today". */
  tag?: string | null
  /** The full-width button at the foot — Choose date or Call to order. Omitted: a card that only links. */
  action?: CardAction
  dict: Dict["store"]["item"]
  className?: string
}

const looks: Record<"muted" | "plain", string> = {
  muted: "opacity-45",
  plain: "",
}

const actions: Record<CardAction["look"], "outlineLink" | "outlineAccent"> = {
  choose: "outlineLink",
  call: "outlineAccent",
}

/**
 * One item as a customer card (16px corners, 1px border, no shadow): photo with its chip, name, price, an optional green
 * tag and an optional button. The name's link stretches over the whole card, so a tap anywhere opens /menu/[slug]; the
 * button sits above that layer.
 */
export function ItemCard({ item, chip, muted = false, tag, action, dict, className }: ItemCardProps) {
  const { price, unit } = priceParts(item, dict)
  return (
    <article
      className={`relative flex flex-col gap-3 rounded-card border border-border bg-background p-4 transition-transform duration-150 ease-out active:scale-99 motion-reduce:transition-none ${looks[muted ? "muted" : "plain"]} ${className ?? ""}`}
    >
      <ItemPhoto image={item.image} alt={item.imageAlt} chip={chip} muted={muted} />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-sans text-body font-medium text-pretty">
          <Link
            href={itemHref(item.slug)}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-o700"
          >
            {item.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-1 tabular-nums">
          <span className="font-semibold text-o700">{price}</span>
          {unit ? <span className="text-small text-muted">{unit}</span> : null}
        </p>
        {tag ? (
          <Tag tone="green" className="self-start">
            {tag}
          </Tag>
        ) : null}
      </div>
      {action ? (
        <ButtonLink href={action.href} variant={actions[action.look]} aria-label={action.ariaLabel} className="relative z-10 w-full font-semibold">
          {action.label}
        </ButtonLink>
      ) : null}
    </article>
  )
}
