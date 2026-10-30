import { Suspense } from "react"
import { priceParts } from "@/components/item-card/card"
import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import type { ItemPageData } from "@/lib/storefront/item"
import { noticeLength } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { cutoffPhrase, type ItemCopy } from "./availability"
import { ItemAbout } from "./ItemAbout"
import { ItemAllergens } from "./ItemAllergens"
import { ItemDetails } from "./ItemDetails"
import { ItemGallery } from "./ItemGallery"
import { ItemIngredients } from "./ItemIngredients"
import { ItemJsonLd } from "./ItemJsonLd"
import { ItemOrder } from "./ItemOrder"
import { ItemPrice } from "./ItemPrice"
import { ItemTitle } from "./ItemTitle"
import { OrderSkeleton } from "./OrderSkeleton"
import { RelatedItems } from "./RelatedItems"
import { TitleSync } from "./TitleSync"

type ItemDetailProps = {
  data: ItemPageData
  dict: Dict["store"]
}

const TITLE_ID = "item-title"

/**
 * The item page (/menu/[slug], §10R), inside the store shell's Container — rendered on the server into the static page, so
 * crawlers get all of it: photos beside the name, price and notice, then About / Details / Ingredients / Allergens, two across
 * from 768px, "You might also like", and the item as structured data. Only the order area — "On the counter today", the
 * pickup-date strip and Add to cart, or the Call block — moves with orders and the clock: ItemOrder fetches it in the browser.
 * The panel sticks while the photos scroll, from 768px.
 */
export function ItemDetail({ data, dict }: ItemDetailProps) {
  const { item, phone } = data
  const d = dict.itemPage
  const { price, unit } = priceParts({ pricePaise: item.basePricePaise, priceUnit: item.priceUnit, orderable: item.orderable }, dict.item)
  const identity = {
    id: item.id,
    slug: item.slug,
    name: item.name,
    image: item.photos[0]?.id ?? null,
    pricePaise: item.basePricePaise,
    priceUnit: item.priceUnit,
    noticeDays: item.noticeDays,
  }
  // All the client island gets of `dict.store`.
  const copy: ItemCopy = { itemPage: d, item: dict.item, notice: dict.notice, allergens: dict.allergens, days: dict.days }
  const callLabel = phone ? fill(d.call, { phone: formatForDisplay(phone) }) : ""

  const notice = !item.orderable
    ? null
    : item.noticeDays === 0
      ? dict.notice.sameDay
      : fill(d.needs, { notice: noticeLength(item.noticeDays, dict.notice) })
  const noticeRow = !item.orderable
    ? d.noticeCallOnly
    : item.noticeDays === 0
      ? fill(d.noticeSameDay, { cutoff: cutoffPhrase(data.defaultCutoff, d.cutoff) })
      : notice
  const details = [
    item.sizeNote ? { label: d.size, value: item.sizeNote } : null,
    noticeRow ? { label: d.notice, value: noticeRow } : null,
    item.storageNote ? { label: d.storage, value: item.storageNote } : null,
  ].filter((row) => row !== null)

  return (
    <>
      <ItemJsonLd data={data} />
      <TitleSync text={item.name} target={TITLE_ID} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
        <div className="min-w-0 lg:col-span-3">
          <ItemGallery photos={item.photos} name={item.name} dict={{ photos: d.photos, photo: d.photo, showPhoto: d.showPhoto }} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 md:sticky md:top-21 md:self-start lg:col-span-2">
          <div className="flex flex-col gap-2">
            <ItemTitle id={TITLE_ID} name={item.name} description={item.shortDescription} />
            <ItemPrice price={price} unit={unit} notice={notice} />
          </div>
          {/* ItemOrder reads ?day= — under Suspense, so the page stays static; the HTML has the skeleton. */}
          <Suspense fallback={<OrderSkeleton label={d.loading} />}>
            <ItemOrder item={identity} orderable={item.orderable} defaultCutoff={data.defaultCutoff} phone={phone} callLabel={callLabel} dict={copy} />
          </Suspense>
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
      {item.orderable ? <div aria-hidden className="h-24 shrink-0 md:hidden" /> : null}
    </>
  )
}
