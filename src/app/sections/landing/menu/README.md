# menu

"Everything we bake" on `/` (§10R): every active item, in the bakery's category order, under category chips. Every item can be ordered
ahead (Add to cart, straight from the card) or, call only, called about — nothing fades. Imported from
`Bakery Order Landing.dc.html`.

## Files in this folder

```
menu/
  Menu.tsx             entry (server) — heading; builds the filters and the cards, hands both to CategoryFilter
  CategoryFilter.tsx   "use client" — the chips (All + each category with its count) and the grid they narrow
  copy.ts              menuChip (the notice chip), addCopy (Add to cart's words), menuAction (Add to cart / Call to order / none)
  README.md
```

## Component tree

```
section (nothing when the catalogue is empty)
├─ h2#menu  dict.title
└─ CategoryFilter label filters cards
   ├─ div[role=group] → Chip × n  tone=ink shape=pill size=small, aria-pressed, "Cakes 3"
   └─ ul.grid → li × shown → ItemCard  chip=menuChip  tag="On the counter today"?  action=menuAction
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `CatalogueItem` (with `dates`, the dates it can be ordered for) |
| `@/lib/storefront/words` | `noticeChip` — "Same day", "Order by tomorrow", "Order 3 days ahead", "Made to order" |
| `@/components/item-card/*` | `ItemCard`; `CardAction`, `AddCopy`, `ItemChip` |
| `@/components/ui/Chip` | the filter chips (`ink` tone, `pill` shape, `small` size) |

Tokens: `text-h2`; breakpoints `md`, `lg`.

## Props

```ts
Menu           { catalogue: CatalogueItem[]; categories: { slug; name }[]; phone: string | null; today: IsoDate; dict: Dict["landing"]["menu"]; store: Dict["store"] }
CategoryFilter { label: string; filters: { key; label; count }[]; cards: { id; key; card: ReactNode }[] }
```

## Dictionary contract

```json
"menu": { "title", "filterLabel", "all", "other", "onCounter": "On the counter today",
          "add": "Add to cart", "addLabel": "Add {name} to cart for {day}", "forDay": "For {day}",
          "call": "Call to order", "callLabel": "Call to order {name}",
          "quantity": "Select quantity", "quantityLabel": "Select quantity for {name}" }
```

Also `store.notice` (the chip), `store.item` (prices, units, "from {price}"), `store.itemPage` (`inCart` /
`inCartSized` — the status line), `store.cart` (`remove`, `removeLabel`) and `store.days`.

## How it works

- **Card** — `ItemCard` with the notice chip on the photo (white), name, price (a call-only item reads "from ₹1,500"), a green "On the
  counter today" tag when it's one of today's counter-items (on or sold out), and a full-width 44px control (`menuAction`):
  - **Size chips and Add to cart** when `dates` has one — the booking window's dates the item can be ordered for, judged by the
    deadline rule in `loadLanding`. The chips are the usual sizes — 0.5, 1, 1.5, 2 kg for an item sold by weight, 1–4 otherwise (every
    size is on the item page), the smallest picked to start so one tap adds it.
    It adds for the cart's day when the item can be had then, else for the earliest date; then the chips edit the cart, with "For
    Wednesday" and Remove under them ([item-card](../../../../components/item-card/)). The item page still lets the customer pick any date.
  - **Call to order** otherwise — call only, or no date open (fully booked, too soon, paused): `tel:` with the phone glyph, o700 border.
    No public phone → no button; the card still opens its page, which says why.
  - Tapping anywhere else on the card opens `/menu/[slug]`.
- **Filter** — client state only, no URL: All plus each category that has an item (and "Other" for uncategorised ones), each with its
  count; the chosen chip goes dark (`aria-pressed`). The cards are rendered on the server and handed to the filter as nodes.

## Responsive behavior

| Width | Effect |
|---|---|
| base | chips wrap; 2 columns, 12px gaps |
| `md` 768px | 3 columns |
| `lg` 1024px | 4 columns |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Wording | `src/content/en.json` → `landing.menu`, `store.notice` |
| Which items, their order, the categories | `loadLanding` in [src/lib/storefront/landing.ts](../../../../lib/storefront/landing.ts) |
| What the chip / button say | [copy.ts](copy.ts) |

## Do not

- Don't fade items or hide them by day — every active item can be ordered ahead or called about.
- Don't put the filter in the URL; it's a quick narrowing.
- No inline `style`, no hardcoded strings.
