# item-detail

The customer item page, `/menu/[slug]` — [src/app/(store)/menu/[slug]/page.tsx](<../../app/(store)/menu/[slug]/page.tsx>). Photos, name,
price and notice, "On the counter today" when it is, the pickup-date strip and Add to cart (or a Call block), then About / Details /
Ingredients / Allergens and "You might also like". Imported from `Menu-slug.dc.html` (revised for order ahead, §10R). It renders inside
the store shell ([store-shell](../store-shell/)), which brings the header (here its Back · title · cart row), the banner, the cart and the
one `Container`. Read model: [src/lib/storefront/item.ts](../../lib/storefront/item.ts); each date is judged by the deadline rule
([src/lib/orders/deadline.ts](../../lib/orders/deadline.ts)) in [availability.ts](availability.ts) — the same functions `placeOrder` and
the cart use.

## Files in this folder

```
item-detail/
  ItemDetail.tsx        entry (server) — the photo | panel split, the panel's mode (order / call), the info grid, related, the phone bar's spacer
  availability.ts       DateOption / DateLook / OrderCopy, dateOptions, initialDate, soonText, cutoffPhrase, orderCopy — client-safe, pure
  TitleSync.tsx         "use client" — hands the item's name to the store header (hooks/usePageTitle); renders nothing
  ItemGallery.tsx       "use client" — 4:3 snap carousel; dots below 1024px, the rail from 1024px; never greyed
  GalleryRail.tsx       "use client" — square thumbnails beside the photo (1024px+), keeps the current one in view
  GalleryDots.tsx       the dot strip on a white pill (below 1024px)
  photos.ts             Photo, coverLoader / thumbLoader — next/image loaders onto Cloudinary
  ItemTitle.tsx         the h1 (id watched by the header) and the short description
  ItemPrice.tsx         price (+ "from" when call only), unit, the notice pill ("Needs 1 day’s notice", "Same day")
  CounterBlock.tsx      green-soft "On the counter today — walk in till 4pm or call" + Call
  CallBlock.tsx         sunken "We make this to order — …" / "No dates open right now — …" + a 48px Call
  OrderPanel.tsx        "use client" — the picked date: DateStrip, the legend, the refusal line, AvailabilityLine, OrderBar
  DateStrip.tsx         "use client" — the booking window's dates as a listbox of 56×64 chips
  DateLegend.tsx        too soon / closed / fully booked swatches — always visible under the strip
  AvailabilityLine.tsx  dot + "Pickup Saturday 10 Oct · order by Friday 6pm" + "Only 2 orders left that day"
  OrderBar.tsx          "use client" — stepper + Add to cart / View cart; fixed bar on phones
  ItemAbout.tsx         the About text as paragraphs and lists (src/lib/menu/about.ts)
  AboutSpans.tsx        one line's bold / italic runs
  ItemIngredients.tsx   ingredient chips (ui/Tag md)
  ItemAllergens.tsx     allergen chips on a bordered card + the kitchen disclaimer — always shown
  ItemDetails.tsx       Size / Notice / Storage rows
  RelatedItems.tsx      "You might also like" — item-card's ItemCard without a button
  README.md
```

## Component tree

```
ItemDetail data=ItemPageData day=?day= dict=dict.store
├─ TitleSync text=name target="item-title"
├─ div grid  (1 col · md 2 cols · lg 3/5 + 2/5)
│  ├─ ItemGallery photos
│  │  ├─ GalleryRail                         lg+, when 2+ photos
│  │  ├─ div[role=region carousel] → div[role=group slide] × n → next/image (coverLoader)
│  │  └─ GalleryDots                         <lg, when 2+ photos
│  └─ div md:sticky
│     ├─ ItemTitle · ItemPrice > Tag (ui)
│     ├─ CounterBlock > CallLink (ui)        on today's counter, not sold out
│     └─ OrderPanel legend=<DateLegend/>     an orderable item with an open date
│        ├─ DateStrip                         div[role=listbox] → button[role=option] × 8
│        ├─ DateLegend · p[role=status] refusal · AvailabilityLine
│        └─ OrderBar key=date                 Stepper lg + Button block "Add to cart · ₹480"
│                                             or Stepper (bound to the cart) + ButtonLink "View cart"
│        or CallBlock > CallLink (ui)         call only · no date open (paused included)
├─ div grid  About (md:order-1) · Ingredients (3) · Allergens (4) · Details (2)
├─ RelatedItems → ItemCard × ≤4              (no button)
└─ div h-24 md:hidden                        room for the phone bar (order mode only)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/item` | `ItemPageData` |
| `@/lib/orders/deadline` | `BookingWindow`, `dayAvailability`, `deadlineFor`, `ordersLeft`, `FEW_ORDERS_LEFT` |
| `@/lib/storefront/words` | `relativeDay`, `noticeLength` |
| `@/lib/menu/about` | `parseAbout`, `AboutSpan` |
| `@/lib/menu/allergens` | `Allergen` |
| `@/lib/cart/cart` | `AddTarget`, `MAX_LINE_QTY` |
| `@/hooks/useCart` | `quantityOf`, `setQuantity` (inside the store-shell's CartProvider) |
| `@/hooks/usePageTitle` | `usePageTitle` (inside the store-shell's PageTitleProvider) |
| `@/components/item-card/*` | `ItemCard` (related), `priceParts` |
| `@/components/ui/*` | `CallLink`, `Stepper` (`size="lg"`), `Button` (`size="block"`), `ButtonLink`, `Tag`, `Icon` (`image`) |
| `@/lib/calendar/cutoffs` · `@/lib/dates` | `formatClock`; `formatShortWeekday`, `formatDayLabel`, `formatLongDayLabel`, `formatWeekday`, `formatTimeIn`, `isoDateInZone` |
| `@/lib/cloudinary` · `@/lib/money` · `@/lib/phone` · `@/lib/template` | `imageUrl`; `formatPaise`; `formatForDisplay`; `fill` |

External: `next/image` (loaders, `fill`, `sizes`). Tokens: `rounded-card`, `rounded-b-sheet`, `rounded-button`, `rounded-chip`, `rounded-pill`,
`border-border`, `border-border-strong`, `bg-sunken`, `bg-o500` (picked date), `bg-o50` / `border-o200` (notice pill), `bg-red-soft` / `text-red`,
`bg-green-soft` / `text-green` / `bg-green`, `text-o700`, `text-muted`, `text-subtle`, `text-h1`, `text-h2`, `text-small`, `text-small-admin`,
`text-micro`, `shadow-raised`, utilities `pb-safe`, `scrollbar-none`; breakpoints `xxs`, `md`, `lg`, `3xl`.

## Props

```ts
ItemDetail       { data: ItemPageData; day: string | undefined; dict: Dict["store"] }
ItemGallery      { photos: Photo[]; name: string; dict: { photos; photo; showPhoto } }
GalleryRail      { photos: Photo[]; index: number; onShow: (index) => void; label: string }
GalleryDots      { count: number; index: number }
ItemTitle        { id: string; name: string; description: string }
ItemPrice        { price: string; unit: string; notice: string | null }
CounterBlock     { text: string; phone: string | null; callLabel: string; callAria: string }
CallBlock        { text: string; phone: string | null; callLabel: string }
OrderPanel       { options: DateOption[]; initial: IsoDate | null; legend: ReactNode; name: string; dict: OrderCopy }
DateStrip        { options: DateOption[]; selected: IsoDate | null; onSelect; onRefuse: (text) => void; label: string }
DateLegend       { soon: string; closed: string; full: string }
AvailabilityLine { line: string; fewLeft: string | null }
OrderBar         { day: DateOption | null; name: string; dict: OrderCopy }
TitleSync        { text: string; target: string }
ItemAbout        { text: string; title: string; className? }
ItemIngredients  { ingredients: string[]; title: string; className? }
ItemAllergens    { allergens: Allergen[]; labels: Dict["store"]["allergens"]; dict: Pick<itemPage, "allergens" | "noAllergens" | "disclaimer">; className? }
ItemDetails      { rows: { label; value }[]; title: string; className? }
RelatedItems     { items: StoreItem[]; title: string; dict: Dict["store"]["item"] }

DateOption       { date; weekday: "Sat"; day: "10"; look: "open" | "soon" | "closed" | "full"; status; label; refusal: string | null;
                   line; fewLeft: string | null; target: AddTarget | null; when }
```

The client components get `OrderCopy` (seven strings) and per-date data, never the whole dict.

## Dictionary contract

```json
"store": {
  "itemPage": {
    "metaTitle", "photos", "photo", "showPhoto", "needs": "Needs {notice}", "chooseDate": "Choose a pickup date",
    "dateLabel": "{date}, {status}", "dateStatus": { "open", "left", "leftOne", "soon": "Too soon — needs {notice}",
    "soonCutoff": "Too soon — orders close {cutoff}", "closed", "full" },
    "cutoff": { "sameDay", "dayBefore", "daysBefore" }, "refusal": "{date} · {status}",
    "pickup": "Pickup {date} · order by {deadline}", "byToday": "{time} today", "byDay": "{weekday} {time}", "fewLeft", "fewLeftOne",
    "counter": { "till", "tillNoPhone", "open", "openNoPhone" }, "counterCall", "callOnly", "noDates",
    "add": "Add to cart · {total}", "addPlain", "viewCart", "inCart", "call": "Call {phone}",
    "about", "ingredients", "allergens", "noAllergens", "disclaimer", "details", "size", "notice", "noticeSameDay", "noticeCallOnly",
    "storage", "related"
  },
  "allergens": { "GLUTEN", "DAIRY", "EGGS", "NUTS", "PEANUTS", "SOY", "SESAME" }
}
```

Also reads `store.notice` (the notice words), `store.item` (`units`, `from`, `decrease`, `increase`, the related cards) and `store.days`.

## How it works

- **Rendered per request** — `loadItem` calls `connection()` (the store layout doesn't — `/` is prerendered): orders taken and every deadline move with the
  clock. Inactive and archived items are a 404 — they can't be ordered. `loadItem` is wrapped in `cache()`, so `generateMetadata` and
  the page share one read.
- **The dates** — the booking window, today … today + `orderAheadDays` (8 chips), from `loadBookingWindow` (unplanned dates take the
  Settings defaults and the opening hours). `dateOptions` judges each with `dayAvailability(day, [noticeDays], window)`:
  - **open** — white; picked: the o500 fill with ink. Title "Open", or "Only 2 orders left" when three or fewer remain.
  - **too soon** — grey: the item's notice (or the day's own cutoff) has passed. Title "Too soon — needs 2 days’ notice"; an item with
    no notice says when the default cutoff closes ("Too soon — orders close 6pm the day before").
  - **closed** — grey, the number struck through. **fully booked** — red-soft.
  
  Tapping one that can't be picked keeps the current date and says why in red ("Fri 9 Oct · Fully booked", `role=status`). Arrow
  keys, Home and End move through every date, picking the open ones. The legend is always visible.
- **Which date opens** — `?day=` when that date is open, else the first open one.
- **The line** — "Pickup Saturday 10 Oct · order by Friday 6pm" ("order by 6pm today" when the deadline is today) — the deadline rule
  for this item — plus "Only 2 orders left that day" in the accent when three or fewer remain.
- **Price** — always the base price: online orders are priced at it (placeOrder); per-day overrides are the counter's. Call only:
  "from ₹1,500". The notice pill: "Needs 1 day’s notice" / "Needs n days’ notice" / "Same day"; none for a call-only item.
- **Add to cart** — pick a quantity (1…99, the cart's cap), then "Add to cart · ₹480". Once the cart holds the item for that date, the
  stepper edits the cart (0 takes it out) and the button becomes View cart, which takes focus; a status line tells screen readers "2 in
  your cart for Saturday". Adding for a date other than the cart's goes through CartProvider's "Switch to …?" dialog. The cart line
  keeps the item's notice, for the cart's own deadline check.
- **Call instead** — a call-only item (`orderable` off): no pill, strip or bar — "We make this to order — call us to talk it through."
  and a 48px Call. No date open (every one too soon, closed or booked, or ordering paused): "No dates open right now — call us and we’ll
  see what we can do." and Call. Without a public phone, the line alone.
- **On the counter today** — when today's counter has it and it isn't sold out: a green-soft line, "walk in till 4pm" from today's
  opening hours, and a Call link when there's a phone.
- **Details** — Size, **Notice** ("Needs 2 days’ notice", "Same day — order by 6pm the day before", "Made to order — call us"), Storage.
- **Phone bar** — `OrderBar` is one element: `fixed` at the bottom under 768px (`pb-safe`, `shadow-raised`), static in the panel from
  768px. The shell's View cart bar stands down on `/menu/*` so two never stack; `ItemDetail` ends with a spacer for it.
- **Header** — `TitleSync` gives the item's name to the store header, which fades it in (150ms, opacity + 4px rise) once the h1 has
  scrolled under it. Back returns to the previous page of the visit, or opens the menu after a direct visit.
- **Gallery** — a horizontal snap scroller; the current photo is worked out from `scrollLeft`. Thumbnails and dots follow it; a
  thumbnail scrolls it (smoothly, unless reduced motion). Images go through `next/image` with Cloudinary loaders; the first photo is
  eager with high fetch priority. It never greys (§10R — every item can be ordered or called about).
- **About** — the form stores plain text with `**bold**`, `_italic_` and "• " lines; `parseAbout` makes paragraphs and lists. Never HTML.
- **Allergens** always render: chips, or "No allergens declared.", then the kitchen disclaimer.
- **Related** — up to four other active items: orderable ones first, then the same category, then the menu's order.
- Server: `ItemDetail`, `ItemTitle`, `ItemPrice`, `CounterBlock`, `CallBlock`, `DateLegend`, `AvailabilityLine`, `GalleryDots`, the info
  sections, `RelatedItems`. Client: `TitleSync`, `ItemGallery`, `GalleryRail`, `OrderPanel`, `DateStrip`, `OrderBar`.

## Responsive behavior

| Width | Effect |
|---|---|
| base (320px+) | one column; gallery full-bleed under the header, only its bottom corners rounded, dots; the date strip scrolls and bleeds to the screen edge; Add to cart in a fixed bottom bar; info sections stacked About → Ingredients → Allergens → Details; related as a 168px snap row |
| `xxs` 375px | the Add button carries the total ("Add to cart · ₹480") |
| `md` 768px | photo and panel side by side, 1 : 1; the panel sticks under the header; the strip stays inside the panel (scrolls there); Add sits inline; info two across; related cards 200px |
| `lg` 1024px | 3 : 2 split, 48px gap; thumbnail rail (96px) replaces the dots; related four across |
| `3xl` 1920px | rail 112px; width follows the shared Container (the design capped at 1280px) |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Any wording | `src/content/en.json` → `store.itemPage`, `store.notice`, `store.allergens` |
| How a date is judged | `dayAvailability` / `deadlineFor` in [src/lib/orders/deadline.ts](../../lib/orders/deadline.ts) — shared with the cart and placeOrder |
| What a chip / line says, which date opens | `dateOptions`, `initialDate` in [availability.ts](availability.ts) |
| Chip looks | `chips` in [DateStrip.tsx](DateStrip.tsx) |
| Related ranking, the counter check | `loadItem` in [src/lib/storefront/item.ts](../../lib/storefront/item.ts) |
| About formatting | [src/lib/menu/about.ts](../../lib/menu/about.ts) (and the form's `AboutField`) |
| Photo sizes / crops | [photos.ts](photos.ts) and the `sizes` in [ItemGallery.tsx](ItemGallery.tsx) |
| The phone bar | `bar` in [OrderBar.tsx](OrderBar.tsx); the shell's `CartBar` hides on `/menu/*` |

## Do not

- Don't judge a date in the browser — `DateOption`s are server data from the deadline rule; placeOrder re-checks everything at submit.
- Don't show a per-day price here — online orders are priced at the base price.
- Don't add a month view or "Later date" — the booking window is 7 days (owner's decision, 4 Oct).
- Don't put the CTA in two elements for two breakpoints — the one bar changes position by CSS.
- No inline `style`, no hardcoded strings, one component per file.
