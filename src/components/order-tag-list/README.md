# order-tag-list

The row of small labelled facts on an order — *Blocked number*, *Ordered before (4)*, *Trusted*, *2 no-shows*, *Delivery*,
*Note*, *By staff · Anjali*, *Custom price*. Rendered on the orders queue (cards and table), the order detail page, and the split pane.

## Files in this folder

```
order-tag-list/
  OrderTagList.tsx   entry — turns OrderTags into Tag primitives, in a fixed order
  README.md
```

## Component tree

```
OrderTagList tags dict include? compact?
└─ span.flex-wrap
   ├─ Tag tone=red      dict.admin.orderTags.suspected          (isSuspected)
   ├─ Tag tone=warm     .before / .beforeShort {count}          (customer.completedCount > 0)
   ├─ Tag tone=green    .trusted
   ├─ Tag tone=red      .noShows / .noShowsOne {count}
   ├─ Tag tone=neutral  .delivery
   ├─ Tag tone=neutral  .note
   ├─ Tag tone=neutral  .staff {name}                           (a staff order — the creator's first name, 7R.5)
   ├─ Tag tone=warm     .customPrice                             (a line priced by hand)
   └─ Tag tone=quiet    .more {count}   (compact only; title lists every hidden tag)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/components/ui/Tag` | each pill |
| `@/lib/orders/queries` | the `OrderTags` type |
| `@/lib/template` | `fill` |
| `@/lib/i18n` | `Dict` |

Tokens via `Tag`: `bg-o50`, `border-o200`, `text-o700`, `bg-green-soft`, `text-green`, `bg-red-soft`, `text-red`, `bg-sunken`, `text-muted`, `rounded-chip`, `text-micro`.

## Props

```ts
OrderTagList {
  tags: OrderTags                                  // from loadOrderQueue / loadOrderDetail
  dict: Dict["admin"]["orderTags"]
  include?: (keyof OrderTags)[]                    // default: all eight
  compact?: boolean                                // table cell: first tag + "+n"
  className?: string
}
```

## How it works

Server-safe, no state. "Ordered before (n)" counts the customer's **completed** orders — the counters move at
COMPLETED, never at VERIFIED. Renders nothing when no fact applies. Order of tags is fixed by `ORDER`: the
warning (blocked) first, then history, trust, no-shows, then the order's shape, then who entered it and its prices.

## Responsive behavior

Wraps at every width. `compact` is for the 1024px+ table, where the cell is one line.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.orderTags` |
| A new fact | add it to `OrderTags` in `src/lib/orders/queries.ts` (`tagsOf`), then to `ORDER` here |
| Tag colours | tones in `src/components/ui/Tag.tsx` |

## Do not

- Signal a fact by colour alone — every tag carries its label.
- Count verified orders as "ordered before".
