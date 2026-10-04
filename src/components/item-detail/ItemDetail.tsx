import { priceParts } from "@/components/item-card/card"
import { formatClock } from "@/lib/calendar/cutoffs"
import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import type { ItemPageData } from "@/lib/storefront/item"
import { noticeLength } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { cutoffPhrase, dateOptions, initialDate, orderCopy, soonText } from "./availability"
import { CallBlock } from "./CallBlock"
import { CounterBlock } from "./CounterBlock"
import { DateLegend } from "./DateLegend"
import { ItemAbout } from "./ItemAbout"
import { ItemAllergens } from "./ItemAllergens"
import { ItemDetails } from "./ItemDetails"
import { ItemGallery } from "./ItemGallery"
import { ItemIngredients } from "./ItemIngredients"
import { ItemPrice } from "./ItemPrice"
import { ItemTitle } from "./ItemTitle"
import { OrderPanel } from "./OrderPanel"
import { RelatedItems } from "./RelatedItems"
import { TitleSync } from "./TitleSync"

type ItemDetailProps = {
  data: ItemPageData
  /** `?day=` from the link that opened the page — the date to pick first when it's open. */
  day: string | undefined
  dict: Dict["store"]
}

const TITLE_ID = "item-title"

/**
 * The item page (/menu/[slug], §10R), inside the store shell's Container: photos beside the name, price and notice, "On
 * the counter today" when it is, then the pickup-date strip and Add to cart — or, for a call-only item or when no date is
 * open, a Call block instead. The panel sticks while the photos scroll, from 768px. Then About / Details / Ingredients /
 * Allergens, two across from 768px; then "You might also like".
 */
export function ItemDetail({ data, day, dict }: ItemDetailProps) {
  const { item, phone } = data
  const d = dict.itemPage
  const { price, unit } = priceParts({ pricePaise: item.basePricePaise, priceUnit: item.priceUnit, orderable: item.orderable }, dict.item)
  const identity = {
    id: item.id,
    slug: item.slug,
    name: item.name,
    image: item.photos[0]?.id ?? null,
    pricePaise: item.basePricePaise,
    noticeDays: item.noticeDays,
  }
  const options = item.orderable ? dateOptions(data.window, identity, data.defaultCutoff, dict) : []
  const ordering = options.some((option) => option.look === "open")
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
  const counter = data.counter
  const counterText = !counter
    ? ""
    : counter.closes
      ? fill(phone ? d.counter.till : d.counter.tillNoPhone, { time: formatClock(counter.closes) })
      : phone
        ? d.counter.open
        : d.counter.openNoPhone
  const details = [
    item.sizeNote ? { label: d.size, value: item.sizeNote } : null,
    noticeRow ? { label: d.notice, value: noticeRow } : null,
    item.storageNote ? { label: d.storage, value: item.storageNote } : null,
  ].filter((row) => row !== null)

  return (
    <>
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
          {counter ? <CounterBlock text={counterText} phone={phone} callLabel={d.counterCall} callAria={callLabel} /> : null}
          {ordering ? (
            <OrderPanel
              options={options}
              initial={initialDate(options, day)}
              legend={<DateLegend soon={soonText(item.noticeDays, data.defaultCutoff, dict)} closed={d.dateStatus.closed} full={d.dateStatus.full} />}
              name={item.name}
              dict={orderCopy(dict)}
            />
          ) : (
            <CallBlock text={item.orderable ? d.noDates : d.callOnly} phone={phone} callLabel={callLabel} />
          )}
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
      {ordering ? <div aria-hidden className="h-24 shrink-0 md:hidden" /> : null}
    </>
  )
}
