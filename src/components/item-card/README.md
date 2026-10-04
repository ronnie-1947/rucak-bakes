# item-card

One menu item as a customer card — photo with a chip, name, price, an optional green tag and an optional button. Used by the landing
page's [fresh-today](../../app/sections/landing/fresh-today/) (counter-items, no button) and [menu](../../app/sections/landing/menu/)
(Choose date / Call to order) bands, and by the item page's "You might also like" ([item-detail](../item-detail/)). Imported from
`Bakery Order Landing.dc.html`. Since §10R nothing adds to the cart from a card: ordering starts on the item page, where the date is
chosen.

## Files in this folder

```
item-card/
  ItemCard.tsx    entry (server) — the bordered card; the name's link (to /menu/[slug]) stretches over it, the button sits above
  ItemPhoto.tsx   4:3 Cloudinary photo (or a glyph on sunken), chip in the corner, greyed when muted
  card.ts         ItemChip, CardAction, priceParts ("from ₹1,500" for a call-only item) — client-safe, pure
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
└─ ButtonLink relative z-10         Choose date (outlineLink) · Call to order (outlineAccent, tel:)   (when given)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `StoreItem` |
| `@/lib/storefront/routes` | `itemHref` — the item page's URL |
| `@/lib/cloudinary` | `imageUrl` |
| `@/components/ui/*` | `ButtonLink`, `Tag` (`TagTone`), `Icon` (`image`) |
| `@/lib/money` · `@/lib/template` | `formatPaise`, `fill` |

External: `next/link`, `next/image` (`unoptimized` — Cloudinary sizes it). Tokens: `rounded-card` (16px customer card), `rounded-panel`
(photo), `border-border`, `bg-sunken`, `text-o700`, `text-muted`, `text-subtle`, `text-small`, `opacity-45`, `grayscale-40`, `outline-o700`.

## Props

```ts
ItemCard  { item: StoreItem; chip: ItemChip | null; muted?: boolean; tag?: string | null; action?: CardAction; dict: Dict["store"]["item"]; className? }
ItemPhoto { image: string | null; alt: string; chip: ItemChip | null; muted: boolean }

ItemChip   { text: string; tone: TagTone }
CardAction { look: "choose" | "call"; label: string; ariaLabel: string; href: string }
```

## How it works

- **The stretched link** — the name's `<a>` has an `after:` layer covering the card (`relative` article), so tapping the photo or the
  padding opens `/menu/[slug]`, and the focus ring draws round the whole card. The button is `relative z-10`, above that layer.
- **Price** — `priceParts`: the item's `pricePaise` (the menu passes the base price, Fresh today the counter's price for the day) and its
  unit; a call-only item (`orderable` off) reads "from ₹1,500".
- **Muted** cards (a sold-out counter-item) are 45% opacity with a 40% greyscale photo, and still open their page.
- What goes in the chip, tag and button is the band's call (`fresh-today`, `menu/copy.ts`). Server Components only.

## Responsive behavior

The card is fluid — its width comes from the band: 2 / 3 / 4 grid columns on the landing page, 168px / 200px in the related strip's
scroller (phones / tablets), a grid column from 1024px. Nothing inside changes by breakpoint; the button is a 44px target at every width.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Unit / "from" wording | `src/content/en.json` → `store.item` |
| Chip / button wording | the band that builds them (`landing.freshToday`, `landing.menu`) |
| Photo crop / size | [ItemPhoto.tsx](ItemPhoto.tsx) |

## Do not

- Don't add to the cart from a card — a pickup date has to be chosen first, on the item page (§10R).
- Don't nest another interactive element in the card except the one button (it sits above the stretched link).
- Don't use `o500` for the price or button text — `o700` is the tapped-or-read colour.
- No inline `style`, no hardcoded strings, one component per file.
