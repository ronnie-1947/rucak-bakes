# item-card

One menu item as a customer card — photo with a chip, name, price, an optional green tag and an optional button. Used by the landing
page's [fresh-today](../../app/sections/landing/fresh-today/) (counter-items, no button) and [menu](../../app/sections/landing/menu/)
(Add to cart / Call to order) bands, and by the item page's "You might also like" ([item-detail](../item-detail/)). Imported from
`Bakery Order Landing.dc.html`. Add to cart puts the item straight in the cart for a date the band worked out (5 Oct — before that,
ordering started on the item page); choosing another date is the item page's job, or the cart's Change day.

## Files in this folder

```
item-card/
  ItemCard.tsx    entry (server) — the bordered card; the name's link (to /menu/[slug]) stretches over it, the button sits above
  ItemPhoto.tsx   4:3 Cloudinary photo (or a glyph on sunken), chip in the corner, greyed when muted
  AddToCart.tsx   "use client" — Add to cart, then a stepper bound to the cart and "For tomorrow"; picks the date
  card.ts         ItemChip, CardAction, AddCopy, priceParts ("from ₹1,500" for a call-only item) — client-safe, pure
  README.md
```

## Component tree

```
ItemCard item chip muted? tag? action? dict=dict.store.item
├─ ItemPhoto image alt chip muted
│  └─ Tag tone=chip.tone            "Order by tomorrow" (plain) · "Made to order" (plain) · "Sold out" (red)
├─ h3 > Link /menu/[slug]           after:absolute inset-0 — the whole card is the tap target
├─ p  price (o700, tabular) + unit  ("per box", muted)
├─ Tag green                        "On the counter today"          (when given)
└─ action (when given), relative z-10
   ├─ AddToCart                     Button "Add to cart" (outlineLink) → Stepper full (0 takes it out) + "For Wednesday"
   └─ CallLink wrap                 Call to order (outlineAccent, phone glyph, tel:)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `StoreItem` |
| `@/lib/storefront/routes` | `itemHref` — the item page's URL |
| `@/lib/cloudinary` | `imageUrl` |
| `@/components/ui/*` | `Button`, `CallLink` (`wrap`), `Stepper` (`width="full"`), `Tag` (`TagTone`), `Icon` (`image`) |
| `@/hooks/useCart` | `cart`, `quantityOf`, `setQuantity` (inside the store-shell's CartProvider) |
| `@/lib/cart/cart` | `AddTarget`, `MAX_LINE_QTY` |
| `@/lib/storefront/words` | `relativeDay` — "tomorrow", "Wednesday" |
| `@/lib/money` · `@/lib/template` | `formatPaise`, `fill` |

External: `next/link`, `next/image` (`unoptimized` — Cloudinary sizes it). Tokens: `rounded-card` (16px customer card), `rounded-panel`
(photo), `border-border`, `bg-sunken`, `text-o700`, `text-muted`, `text-subtle`, `text-small`, `opacity-45`, `grayscale-40`, `outline-o700`.

## Props

```ts
ItemCard  { item: StoreItem; chip: ItemChip | null; muted?: boolean; tag?: string | null; action?: CardAction; dict: Dict["store"]["item"]; className? }
ItemPhoto { image: string | null; alt: string; chip: ItemChip | null; muted: boolean }
AddToCart { item: StoreItem; dates: IsoDate[]; today: IsoDate; dict: AddCopy }

ItemChip   { text: string; tone: TagTone }
CardAction { look: "add"; dates: IsoDate[]; today: IsoDate; copy: AddCopy } | { look: "call"; label: string; ariaLabel: string; phone: string }
AddCopy    { add; addLabel; forDay; inCart; decrease; increase; days: DayWords }
```

## How it works

- **The stretched link** — the name's `<a>` has an `after:` layer covering the card (`relative` article), so tapping the photo or the
  padding opens `/menu/[slug]`, and the focus ring draws round the whole card. The action is `relative z-10`, above that layer.
- **Add to cart** — `dates` are the booking window's dates the item can be ordered for, judged on the server by the deadline rule
  (earliest first, never empty). One tap adds one for the cart's day when the item can be had then — no dialog — else for the earliest
  date; when that clears another day's cart, CartProvider's "Switch to …?" asks first. In the cart, the button becomes a full-width
  stepper bound to the cart (0 takes it out) with "For Wednesday" under it; focus moves to whichever has just appeared. The button's
  name says the day ("Add Brownie box to cart for tomorrow"); a `role=status` line ("1 in your cart for tomorrow") speaks only after a tap
  on this card, not when the stored cart is read on load. The cart and placeOrder judge the date again.
- **Call to order** — a real `tel:` link (`CallLink`, wrapping) with the phone glyph; the band leaves it out when there's no public phone.
- **Price** — `priceParts`: the item's `pricePaise` (the menu passes the base price, Fresh today the counter's price for the day) and its
  unit; a call-only item (`orderable` off) reads "from ₹1,500".
- **Muted** cards (a sold-out counter-item) are 45% opacity with a 40% greyscale photo, and still open their page.
- What goes in the chip, tag and button is the band's call (`fresh-today`, `menu/copy.ts`). Server Components only.

## Responsive behavior

The card is fluid — its width comes from the band: 2 / 3 / 4 grid columns on the landing page, 168px / 200px in the related strip's
scroller (phones / tablets), a grid column from 1024px. Padding is 12px below `xxs` (375px) and 16px from it: at 320px a 2-column card
leaves 112px, just room for the stepper (two 44px buttons and a 20px value). The button and the stepper's buttons are 44px targets at
every width; "Add to cart" and "Call to order" wrap to two lines at 320px.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Unit / "from" wording | `src/content/en.json` → `store.item` |
| Chip / button wording | the band that builds them (`landing.freshToday`, `landing.menu`) |
| Which date Add to cart picks | [AddToCart.tsx](AddToCart.tsx); which dates are open: `loadLanding` ([src/lib/storefront/landing.ts](../../lib/storefront/landing.ts)) |
| Photo crop / size | [ItemPhoto.tsx](ItemPhoto.tsx) |

## Do not

- Don't judge a date in the browser — `dates` come from the deadline rule on the server; AddToCart only chooses among them.
- Don't nest another interactive element in the card except the one action (it sits above the stretched link).
- Don't use `o500` for the price or button text — `o700` is the tapped-or-read colour.
- No inline `style`, no hardcoded strings, one component per file.
