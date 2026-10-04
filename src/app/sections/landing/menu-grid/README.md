# menu-grid

"Everything we bake" on `/`: every active menu item in the bakery's category order. Items on neither today's nor tomorrow's menu render
faded (45% opacity, 40% greyscale) with a "Not today" chip and when they're back — still tappable to their page (runbook 6.1).

## Files in this folder

```
menu-grid/
  MenuGrid.tsx   entry (server) — heading and the grid of ItemCards
  README.md
```

## Component tree

```
section (nothing when the catalogue is empty)
├─ h2#menu-grid  dict.title
└─ ul.grid → li × n → ItemCard   from catalogueCard(entry, days, today, store)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `CatalogueItem`, `StoreDay` |
| `@/components/item-card/*` | `ItemCard`, `catalogueCard` |

Tokens: `text-h2`; breakpoints `md`, `lg`.

## Props

```ts
MenuGrid { catalogue: CatalogueItem[]; days: StoreDay[]; today: IsoDate; dict: Dict["landing"]["menuGrid"]; store: Dict["store"] }
```

## Dictionary contract

```json
"menuGrid": { "title": "Everything we bake" }
```

Card strings come from `dict.store.item`.

## How it works

`catalogueCard` (item-card/offer.ts) decides each card: Add goes to the first of today / tomorrow that has the item and can take it
(with "For tomorrow" under it when that isn't today), otherwise it is disabled with the first listing day's reason; an item on neither
day is muted with "Back Thursday" or "Not on the menu this week". The price shown is that day's (override included), else the base
price. The card links to its item page on that same day (`?day=`, from `CatalogueCard.day`). Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | 2 columns, 12px gaps |
| `md` 768px | 3 columns |
| `lg` 1024px | 4 columns |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Heading | `src/content/en.json` → `landing.menuGrid` |
| Which items appear, their order | `loadLanding` in [src/lib/storefront/landing.ts](../../../../lib/storefront/landing.ts) |
| Which day Add targets, the muted rule | `catalogueCard` in [src/components/item-card/offer.ts](../../../../components/item-card/offer.ts) |
| Columns | the `ul` classes in [MenuGrid.tsx](MenuGrid.tsx) |

## Do not

- Don't hide items that aren't on today's or tomorrow's menu — fade them; customers still look them up.
- No inline `style`, no hardcoded strings.
