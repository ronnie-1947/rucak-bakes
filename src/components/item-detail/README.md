# item-detail

The customer item page, `/menu/[slug]` — [src/app/(store)/menu/[slug]/page.tsx](<../../app/(store)/menu/[slug]/page.tsx>). Photos, name,
price, the pickup days with what each one offers, Add to cart, then About / Details / Ingredients / Allergens and "You might also like".
Imported from `Menu-slug.dc.html`. It renders inside the store shell ([store-shell](../store-shell/)), which brings the header (here
its Back · title · cart row), the banner, the cart and the one `Container`. Read model:
[src/lib/storefront/item.ts](../../lib/storefront/item.ts); what each day offers is decided on the server by
[availability.ts](availability.ts), with the rules `placeOrder` applies at submit.

## Files in this folder

```
item-detail/
  ItemDetail.tsx        entry (server) — the photo | panel split, the info grid, related, the phone bar's spacer
  availability.ts       DayOption / DayLook / OrderCopy, dayOptions, initialDay, orderCopy — client-safe, pure
  TitleSync.tsx         "use client" — hands the item's name to the store header (hooks/usePageTitle); renders nothing
  ItemGallery.tsx       "use client" — 4:3 snap carousel; dots below 1024px, the rail from 1024px; greyed when no day can take an order
  GalleryRail.tsx       "use client" — square thumbnails beside the photo (1024px+), keeps the current one in view
  GalleryDots.tsx       the dot strip on a white pill (below 1024px)
  photos.ts             Photo, coverLoader / thumbLoader — next/image loaders onto Cloudinary
  ItemTitle.tsx         the h1 (id watched by the header) and the short description
  OrderPanel.tsx        "use client" — the selected day: price, PickupDays, AvailabilityLine, OrderBar
  PickupDays.tsx        "use client" — the day chips as a radio group
  AvailabilityLine.tsx  dot + the day's line + the batch bar (ui/Meter)
  OrderBar.tsx          "use client" — stepper + Add to cart / View cart, or Call, or Add disabled; fixed bar on phones
  ItemAbout.tsx         the About text as paragraphs and lists (src/lib/menu/about.ts)
  AboutSpans.tsx        one line's bold / italic runs
  ItemIngredients.tsx   ingredient chips (ui/Tag md)
  ItemAllergens.tsx     allergen chips on a bordered card + the kitchen disclaimer — always shown
  ItemDetails.tsx       Size / Storage rows
  RelatedItems.tsx      "You might also like" — item-card's ItemCard without Add
  README.md
```

## Component tree

```
ItemDetail data=ItemPageData day=?day= dict=dict.store
├─ TitleSync text=name target="item-title"
├─ div grid  (1 col · md 2 cols · lg 3/5 + 2/5)
│  ├─ ItemGallery photos muted
│  │  ├─ GalleryRail                         lg+, when 2+ photos
│  │  ├─ div[role=region carousel] → div[role=group slide] × n → next/image (coverLoader)
│  │  └─ GalleryDots                         <lg, when 2+ photos
│  └─ div md:sticky
│     └─ OrderPanel heading=<ItemTitle/> options initial basePrice unit call
│        ├─ ItemTitle                         h1#item-title, description   (server-rendered, passed in)
│        ├─ p  price (selected day's, text-h1 o700) + unit
│        ├─ PickupDays                        div[role=radiogroup] → button[role=radio] × days (ui/chipClasses)
│        ├─ AvailabilityLine                  dot + line (aria-live) + Meter
│        └─ OrderBar key=day                  Stepper lg + Button block "Add to cart · ₹480"
│                                             or Stepper (bound to the cart) + ButtonLink "View cart"
│                                             or a tel: "Call +91 …"   or Button "Add to cart" disabled
├─ div grid  About (md:order-1) · Ingredients (3) · Allergens (4) · Details (2)
├─ RelatedItems → ItemCard × ≤4              (no offer → no Add)
└─ div h-24 md:hidden                        room for the phone bar
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/item` | `ItemPageData` |
| `@/lib/storefront/types` | `ItemDay`, `StoreItem` |
| `@/lib/storefront/words` | `relativeDay` |
| `@/lib/menu/about` | `parseAbout`, `AboutSpan` |
| `@/lib/menu/allergens` | `Allergen` |
| `@/lib/cart/cart` | `AddTarget` |
| `@/hooks/useCart` | `quantityOf`, `setQuantity` (inside the store-shell's CartProvider) |
| `@/hooks/usePageTitle` | `usePageTitle` (inside the store-shell's PageTitleProvider) |
| `@/components/item-card/ItemCard` | the related cards |
| `@/components/ui/*` | `chipClasses` (`tone`, `size="customer"`), `Stepper` (`size="lg"`), `Button` (`size="block"`), `ButtonLink`, `Meter`, `Tag` (`size="md"`), `Icon` (`image`, `alert`, `phone`) |
| `@/lib/calendar/cutoffs` · `@/lib/dates` | `formatClock`; `formatShortWeekday`, `formatLongDayLabel`, `addDays` |
| `@/lib/cloudinary` · `@/lib/money` · `@/lib/phone` · `@/lib/template` | `imageUrl`; `formatPaise`; `formatForDisplay`; `fill` |

External: `next/image` (loaders, `fill`, `sizes`). Tokens: `rounded-card`, `rounded-b-sheet`, `rounded-button`, `rounded-pill`, `border-border`,
`border-border-strong`, `bg-sunken`, `bg-o500` / `bg-o50` / `border-o200` (chips, dots), `bg-red-soft` / `text-red` / `border-red`, `bg-green`,
`bg-muted`, `text-o700`, `text-muted`, `text-subtle`, `text-h1`, `text-h2`, `text-small`, `text-micro`, `shadow-raised`, `opacity-45`,
`grayscale-40`, utilities `pb-safe`, `scrollbar-none`; breakpoints `xxs`, `md`, `lg`, `3xl`.

## Props

```ts
ItemDetail       { data: ItemPageData; day: string | undefined; dict: Dict["store"] }
ItemGallery      { photos: Photo[]; name: string; muted: boolean; dict: { photos; photo; showPhoto } }
GalleryRail      { photos: Photo[]; index: number; onShow: (index) => void; label: string }
GalleryDots      { count: number; index: number }
ItemTitle        { id: string; name: string; description: string }
OrderPanel       { heading: ReactNode; options: DayOption[]; initial: IsoDate | null; basePrice; unit; name; call: { href; label } | null; dict: OrderCopy }
PickupDays       { options: DayOption[]; selected: IsoDate | null; onSelect: (date) => void; label: string }
AvailabilityLine { line: string; tone: LineTone; meter: DayOption["meter"] }
OrderBar         { day: DayOption | null; reason: string; name: string; call: { href; label } | null; dict: OrderCopy }
TitleSync        { text: string; target: string }
ItemAbout        { text: string; title: string; className? }
ItemIngredients  { ingredients: string[]; title: string; className? }
ItemAllergens    { allergens: Allergen[]; labels: Dict["store"]["allergens"]; dict: Pick<itemPage, "allergens" | "noAllergens" | "disclaimer">; className? }
ItemDetails      { rows: { label; value }[]; title: string; className? }
RelatedItems     { items: StoreItem[]; title: string; dict: Dict["store"]["item"] }

DayOption        { date; label; ariaLabel; look: "open" | "unavailable" | "off"; line; tone: "green" | "red" | "muted";
                   meter: { value; max; label } | null; price; target: AddTarget | null; call: boolean; when }
```

The client components get `OrderCopy` (eight strings) and per-day data, never the whole dict.

## Dictionary contract

```json
"store": {
  "itemPage": {
    "metaTitle", "photos", "photo", "showPhoto", "pickupDay", "labels": { "today", "tomorrow" },
    "day": "{label}, {date}", "dayStatus": "{label}, {date}, {status}",
    "status": { "soldOut", "full", "cutoff", "paused", "off" },
    "line": { "open": "Available {day} · order by {time} {when} · {left} of {quantity} left",
              "soldOut", "full", "cutoff", "paused", "next": "{line} — available {day}", "none" },
    "meter", "add": "Add to cart · {total}", "addPlain", "viewCart", "inCart", "call": "Call {phone}",
    "about", "ingredients", "allergens", "noAllergens", "disclaimer", "details", "size", "storage", "related"
  },
  "allergens": { "GLUTEN", "DAIRY", "EGGS", "NUTS", "PEANUTS", "SOY", "SESAME" }
}
```

Also reads `store.item` (`units`, `decrease`, `increase`, and the related cards' strings) and `store.days`.

## How it works

- **Rendered per request** — `loadItem` calls `connection()` (the store layout does too), so quantities left are never stale. The runbook
  asked for `generateStaticParams` + a short `revalidate`; the layout makes every store route dynamic, and a cached "4 left" would
  mislead. Inactive and archived items are a 404 — they can't be ordered. `loadItem` is wrapped in `cache()`, so `generateMetadata`
  and the page share one read.
- **The days** — today through the last day of the order-ahead window whose menu has the item (today and tomorrow always). Each day's
  status comes from `dayStatus` (src/lib/storefront/status.ts), the same function the landing page uses: paused › closed › past cutoff
  › full › open. `dayOptions` turns each into a chip:
  - **open** (warm; selected = o500 fill, ink text) — on the menu, taking orders, some left. Line: "Available tomorrow · order by 6pm
    today · 9 of 12 left", plus the bar once some are ordered.
  - **unavailable** (red, struck through) — on the menu but sold out, fully booked, past its cutoff or paused. Line says which, and
    "— available Tuesday" when another day can take it.
  - **off** (disabled) — not on that day's menu (closed, unplanned, or the owner didn't put it on).
- **Which day opens** — `?day=` when that day has the item (the landing cards add it, so the page opens on the tab or card you came
  from), else the first that can take the order, else the first that has it, else none ("Not on the menu this week").
- **Price** follows the selected day — the calendar can override it per day. Display only: the order pipeline prices the order.
- **Add to cart** — pick a quantity (1…what's left), then "Add to cart · ₹480". Once the cart holds the item for that day, the stepper
  edits the cart (0 takes it out) and the button becomes View cart, which takes focus; a status line tells screen readers "2 in your
  cart for tomorrow". Adding for a day other than the cart's goes through CartProvider's "Switch to …?" dialog.
- **Can't add** — sold out or fully booked: "Call +91 …" (a tel: link) when the bakery has a public phone, instead of the design's
  "Notify me" (nothing exists to collect or send those alerts — owner's call, 4 Oct). Otherwise Add is disabled. On phones the line is
  repeated in the bar, since the chips are out of sight.
- **Phone bar** — `OrderBar` is one element: `fixed` at the bottom under 768px (`pb-safe`, `shadow-raised`), static in the panel from
  768px. The shell's View cart bar stands down on `/menu/*` so two never stack; `ItemDetail` ends with a spacer for it.
- **Header** — `TitleSync` gives the item's name to the store header, which fades it in (150ms, opacity + 4px rise) once the h1 has
  scrolled under it. Back returns to the previous page of the visit, or opens the menu after a direct visit.
- **Gallery** — a horizontal snap scroller; the current photo is worked out from `scrollLeft`. Thumbnails and dots follow it; a
  thumbnail scrolls it (smoothly, unless reduced motion). Images go through `next/image` with Cloudinary loaders, so the srcset is
  real widths; the first photo is eager with high fetch priority. Greyed (45%, greyscale 40%) when no day in the window can take an
  order, like the menu's "Not today" cards.
- **About** — the form stores plain text with `**bold**`, `_italic_` and "• " lines; `parseAbout` makes paragraphs (one per line) and
  lists. Never HTML.
- **Allergens** always render: chips, or "No allergens declared.", then the kitchen disclaimer.
- **Related** — up to four other active items: those on an open day this week first, then the same category, then the menu's order.
- Server: `ItemDetail`, `ItemTitle`, `AvailabilityLine`, `GalleryDots`, the info sections, `RelatedItems`. Client: `TitleSync`,
  `ItemGallery`, `GalleryRail`, `OrderPanel`, `PickupDays`, `OrderBar`.

## Responsive behavior

| Width | Effect |
|---|---|
| base (320px+) | one column; gallery full-bleed under the header, only its bottom corners rounded, dots; Add to cart in a fixed bottom bar; info sections stacked About → Ingredients → Allergens → Details; related as a 168px snap row |
| `xxs` 375px | the Add button carries the total ("Add to cart · ₹480") |
| `md` 768px | photo and panel side by side, 1 : 1 (the design's 58 : 42 leaves Add too narrow for "Add to cart · ₹1,200" at 768–820px); the panel sticks under the header; Add sits inline; info two across; related cards 200px |
| `lg` 1024px | 3 : 2 split, 48px gap; thumbnail rail (96px) replaces the dots; related four across |
| `3xl` 1920px | rail 112px; width follows the shared Container (the design capped at 1280px) |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Any wording | `src/content/en.json` → `store.itemPage`, `store.allergens` |
| What a day's chip / line / CTA says | `dayOptions` in [availability.ts](availability.ts) |
| Which day opens first | `initialDay` in [availability.ts](availability.ts) |
| Which days show, related ranking | `loadItem` in [src/lib/storefront/item.ts](../../lib/storefront/item.ts) |
| How a day's status is judged | `dayStatus` in [src/lib/storefront/status.ts](../../lib/storefront/status.ts) — shared with the landing page |
| About formatting | [src/lib/menu/about.ts](../../lib/menu/about.ts) (and the form's `AboutField`) |
| Chip looks | `chipClasses` tones in `src/components/ui/Chip.tsx` (shared with admin filters) |
| Photo sizes / crops | [photos.ts](photos.ts) and the `sizes` in [ItemGallery.tsx](ItemGallery.tsx) |
| The phone bar | `bar` in [OrderBar.tsx](OrderBar.tsx); the shell's `CartBar` hides on `/menu/*` |

## Do not

- Don't decide availability in the browser — `DayOption`s are server data; placeOrder re-checks everything at submit anyway.
- Don't send the shown price anywhere but the cart's display snapshot.
- Don't add a "Notify me" button until something can actually notify.
- Don't put the CTA in two elements for two breakpoints — the one bar changes position by CSS.
- No inline `style`, no hardcoded strings, one component per file.
