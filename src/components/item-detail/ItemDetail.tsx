import type { Dict } from "@/lib/i18n"
import { formatPaise } from "@/lib/money"
import { formatForDisplay } from "@/lib/phone"
import type { ItemPageData } from "@/lib/storefront/item"
import { fill } from "@/lib/template"
import { dayOptions, initialDay, orderCopy } from "./availability"
import { ItemAbout } from "./ItemAbout"
import { ItemAllergens } from "./ItemAllergens"
import { ItemDetails } from "./ItemDetails"
import { ItemGallery } from "./ItemGallery"
import { ItemIngredients } from "./ItemIngredients"
import { ItemTitle } from "./ItemTitle"
import { OrderPanel } from "./OrderPanel"
import { RelatedItems } from "./RelatedItems"
import { TitleSync } from "./TitleSync"

type ItemDetailProps = {
  data: ItemPageData
  /** `?day=` from the link that opened the page — the day to select first when the item is on it. */
  day: string | undefined
  dict: Dict["store"]
}

const TITLE_ID = "item-title"

/**
 * The item page (/menu/[slug]), inside the store shell's Container: photos beside the name, price, pickup days
 * and Add to cart (the panel sticks while the photos scroll, from 768px); then About / Details / Ingredients /
 * Allergens, two across from 768px; then "You might also like". The shell's main stacks the three at 32 / 48px.
 */
export function ItemDetail({ data, day, dict }: ItemDetailProps) {
  const { item, today } = data
  const d = dict.itemPage
  const options = dayOptions(data.days, { id: item.id, slug: item.slug, name: item.name, image: item.photos[0]?.id ?? null }, today, dict)
  const call = data.phone ? { href: `tel:${data.phone}`, label: fill(d.call, { phone: formatForDisplay(data.phone) }) } : null
  const details = [
    item.sizeNote ? { label: d.size, value: item.sizeNote } : null,
    item.storageNote ? { label: d.storage, value: item.storageNote } : null,
  ].filter((row) => row !== null)

  return (
    <>
      <TitleSync text={item.name} target={TITLE_ID} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
        <div className="min-w-0 lg:col-span-3">
          <ItemGallery
            photos={item.photos}
            name={item.name}
            muted={!options.some((option) => option.look === "open")}
            dict={{ photos: d.photos, photo: d.photo, showPhoto: d.showPhoto }}
          />
        </div>
        <div className="min-w-0 md:sticky md:top-21 md:self-start lg:col-span-2">
          <OrderPanel
            heading={<ItemTitle id={TITLE_ID} name={item.name} description={item.shortDescription} />}
            options={options}
            initial={initialDay(options, day)}
            basePrice={formatPaise(item.basePricePaise)}
            unit={dict.item.units[item.priceUnit]}
            name={item.name}
            call={call}
            dict={orderCopy(dict)}
          />
        </div>
      </div>
      {/* Phones read About, Ingredients, Allergens, Details; from 768px About | Details over Ingredients | Allergens. */}
      <div className="grid items-start gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:gap-12">
        {item.about ? <ItemAbout text={item.about} title={d.about} className="md:order-1" /> : null}
        <ItemIngredients ingredients={item.ingredients} title={d.ingredients} className="md:order-3" />
        <ItemAllergens allergens={item.allergens} labels={dict.allergens} dict={d} className="md:order-4" />
        <ItemDetails rows={details} title={d.details} className="md:order-2" />
      </div>
      <RelatedItems items={data.related} title={d.related} dict={dict.item} />
      {/* Room under the last card for the phone's Add to cart bar. */}
      <div aria-hidden className="h-24 shrink-0 md:hidden" />
    </>
  )
}
