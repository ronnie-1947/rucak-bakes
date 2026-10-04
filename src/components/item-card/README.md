# item-card

One menu item as a customer card — photo with a chip, name, price, and Add. Used by two landing bands: the Today / Tomorrow strip
([day-strip](../../app/sections/landing/day-strip/)) and Everything we bake ([menu-grid](../../app/sections/landing/menu-grid/)) — and,
without Add, by the item page's "You might also like" ([item-detail](../item-detail/)).
Imported from `Bakery Order Landing.dc.html`. What Add does — or why it can't — is decided on the server by [offer.ts](offer.ts), with
the same rules `placeOrder` applies at submit.

## Files in this folder

```
item-card/
  ItemCard.tsx    entry (server) — the bordered card; the name's link (to /menu/[slug]?day=) stretches over it, Add sits above
  ItemPhoto.tsx   4:3 Cloudinary photo (or a glyph on sunken), chip in the corner, greyed when muted
  AddToCart.tsx   "use client" — + Add, then − qty + (ui/Stepper); disabled with the reason underneath
  offer.ts        Offer / ItemChip, priceParts, dayReason, dayOffer, dayChip, catalogueCard — client-safe, pure
  README.md
```

## Component tree

```
ItemCard item offer? chip day? muted dict=dict.store.item
├─ ItemPhoto image alt chip muted
│  └─ Tag tone=chip.tone                   "Sold out" (red) · "Only 2 left" (warm) · "Not today" (quiet)
├─ h3 > Link /menu/[slug]?day=             after:absolute inset-0 — the whole card is the tap target
├─ p  price (o700, tabular) + unit ("per box", muted)
└─ AddToCart name offer                     (only when an offer is given)
   ├─ Button outlineLink lg "+ Add"        (not in cart for that day, or disabled)
   │  or Stepper 0…max                      (in cart for that day)
   └─ span  reason ?? hint                  "Orders for today closed at 8pm yesterday" · "For tomorrow"
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `StoreItem`, `DayItem`, `StoreDay`, `CatalogueItem`, `FEW_LEFT` |
| `@/lib/storefront/words` | `relativeDay` |
| `@/lib/storefront/routes` | `itemHref` — the item page's URL, with `?day=` |
| `@/lib/cart/cart` | `AddTarget` |
| `@/hooks/useCart` | `quantityOf`, `setQuantity` (inside the store-shell's CartProvider) |
| `@/lib/calendar/cutoffs` | `formatClock` — "6pm" |
| `@/lib/cloudinary` | `imageUrl` |
| `@/components/ui/*` | `Button`, `Stepper`, `Tag` (`TagTone`), `Icon` (`plus`, `image`) |
| `@/lib/money` · `@/lib/template` | `formatPaise`, `fill` |

External: `next/link`, `next/image` (`unoptimized` — Cloudinary sizes it). Tokens: `rounded-card` (16px customer card),
`rounded-panel` (photo), `border-border`, `bg-sunken`, `text-o700`, `text-muted`, `text-subtle`, `text-micro`, `text-small`,
`opacity-45`, `grayscale-40`, `outline-o700`.

## Props

```ts
ItemCard  { item: StoreItem; offer?: Offer; chip: ItemChip | null; day?: IsoDate | null; muted?: boolean; dict: Dict["store"]["item"]; className? }
ItemPhoto { image: string | null; alt: string; chip: ItemChip | null; muted: boolean }
AddToCart { name: string; offer: Offer; dict: Pick<Dict["store"]["item"], "add" | "addLabel" | "decrease" | "increase"> }

Offer     { target: AddTarget | null; reason: string | null; hint: string | null }
ItemChip  { text: string; tone: TagTone }
```

## How it works

- **The offer** — `dayOffer(item, day)`: if the day isn't taking orders, `target` is null and `reason` says why, in `placeOrder`'s
  order (paused › closed › past cutoff › full); an item with nothing left is "None left for today". Otherwise `target` carries
  what the cart stores plus `max` = what the day has left. `catalogueCard` picks the day for a grid card: the first of today /
  tomorrow that has the item and can take it, else the first that has it (disabled, with that day's reason); `hint` "For tomorrow"
  when it isn't today. An item on neither day is `muted`, chip "Not today", reason "Back Thursday" (its next open day in the
  order-ahead window) or "Not on the menu this week".
- **No offer** — the card only links (no Add row). The item page's related strip uses it this way.
- **The day in the link** — `day` adds `?day=` to the card's link, so the item page opens on that day: a day-strip card passes its
  tab's day, a grid card the day `catalogueCard` picked (`CatalogueCard.day`; none for a "Not today" card).
- **Muted** cards are 45% opacity with a 40% greyscale photo (runbook 6.1) and still open their page.
- **The stretched link** — the name's `<a>` has an `after:` layer covering the card (`relative` article), so tapping the photo or
  the padding opens `/menu/[slug]`, and the focus ring draws round the whole card. `AddToCart` is `relative z-10`, above that layer; a
  disabled Add lets the tap through to the link.
- **Add → stepper** — once the cart holds the item for that day, the control is `ui/Stepper` (0…max); 0 removes the line. Adding for
  a different day than the cart's goes through CartProvider's "Switch to …?" dialog. Before hydration every card shows + Add.
- **Heights** — the control row is `min-h-12` so the 48px Add and the 44px stepper swap without the card jumping.
- Server: `ItemCard`, `ItemPhoto`. Client: `AddToCart` (cart state).

## Responsive behavior

The card is fluid — its width comes from the band: 168px / 200px in the day strip's scroller (phones / tablets), a grid column from
1024px, and 2 / 3 / 4 columns in the menu grid. Nothing inside changes by breakpoint; the Add is a 48px target at every width.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Chip / reason / unit wording | `src/content/en.json` → `store.item` |
| When "Only n left" starts | `FEW_LEFT` in [src/lib/storefront/types.ts](../../lib/storefront/types.ts) |
| Which day a grid card adds to | `catalogueCard` in [offer.ts](offer.ts) |
| A new reason a day can't take orders | `DayStatus` + `loadLanding` in `src/lib/storefront/`, then `dayReason` here |
| Photo crop / size | [ItemPhoto.tsx](ItemPhoto.tsx) |
| Stepper look | `src/components/ui/Stepper.tsx` (shared with admin) |

## Do not

- Don't decide availability in the browser — the offer is server data; the order pipeline re-checks it all at submit anyway.
- Don't nest another interactive element in the card except inside `AddToCart` (it sits above the stretched link).
- Don't use `o500` for the price or Add text — `o700` is the tapped-or-read colour.
- No inline `style`, no hardcoded strings, one component per file.
