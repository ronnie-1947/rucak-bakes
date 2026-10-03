# admin-orders

The orders queue at `/admin/orders` ([page](<../../app/admin/(shell)/orders/page.tsx>)) — imported from `Admin-orders.dc.html`.
Default view: today and tomorrow, pending first. Filters live in the URL ([src/lib/orders/filters.ts](../../lib/orders/filters.ts)),
so every chip is a plain link and a filtered view survives refresh and back.

## Files in this folder

```
admin-orders/
  AdminOrders.tsx        entry (server) — header, filter bar, banner, empty states, board, 2xl split pane
  OrdersHeader.tsx       h1, capacity meters, Select / Done (a link toggling ?select=1)
  CapacityMeters.tsx     today / tomorrow verified vs maxOrders, Meter bar, red "· full"
  OrdersFilterBar.tsx    sticky: SearchBox (ui) + Date / Status / Show chip rows (ChipLink) + Clear filters
  CustomDateChip.tsx     "use client" — a chip over a native date input → ?date=YYYY-MM-DD
  UnnotifiedBanner.tsx   warm notice linking pending orders whose Telegram notification failed
  OrderBoard.tsx         "use client" — day groups; cards <1024, table ≥1024; bulk selection state
  OrderGroupHeader.tsx   "Today · Fri 2 Oct — 9 orders" … "5/10 verified"
  OrderCard.tsx          "use client" — one order on phones/tablets; overlay link, Call + StatusMenu
  OrderTable.tsx         the ≥1024 table shell (thead, column widths)
  OrderTableRow.tsx      "use client" — one row; code links to the page (<2xl) or the pane (2xl)
  WhenLine.tsx           "Pickup 11:30" / "Delivery"
  BulkBar.tsx            "use client" — sticky bottom: N selected · Cancel all · Verify all
  types.ts               AdminCopy, OrdersCopy, OrderLinks, BoardOrder
  README.md
```

## Component tree

```
AdminOrders dict=dict.admin queue filters pane
├─ OrdersHeader                         .title · .select/.done
│  └─ CapacityMeters (md+ beside h1, below it on phones)  .today/.tomorrow · .capacity · .capacityFull
├─ OrdersFilterBar                      .filters.* · .searchLabel/.searchPlaceholder
│  ├─ SearchBox
│  ├─ ChipLink × (today, tomorrow, week) + CustomDateChip
│  ├─ ChipLink × statusChoices
│  └─ ChipLink × showToggles + Clear filters
├─ UnnotifiedBanner                     .unnotified/.unnotifiedOne
├─ EmptyState (.emptyToday + View tomorrow | .emptyFiltered + Clear filters)
│  or OrderActionsProvider > OrderBoard
│     ├─ section per day: OrderGroupHeader
│     │  ├─ OrderCard × n  (lg:hidden; 1 col, 2 from md)  → OrderTagList, StatusMenu, SelectBox
│     │  └─ OrderTable > OrderTableRow × n (hidden <lg)
│     └─ BulkBar (select mode)          .selected · .verifyAll · .cancelAll
└─ aside (2xl, when ?order=) > OrderDetail variant="pane"   (src/components/admin-order-detail)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/orders/queries` | `OrderQueue`, `OrderRowData`, `OrderGroupData`, `CapacityData`, `OrderDetailData` |
| `@/lib/orders/filters` | parse / build filter URLs, `selectedDates` |
| `@/components/order-actions/*` | provider, `StatusMenu` |
| `@/components/order-tag-list/OrderTagList` | the facts row |
| `@/components/admin-order-detail/OrderDetail` | the 2xl pane |
| `@/hooks/useOrderActions` | bulk actions |
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink`, `ChipLink`, `chipClasses`, `EmptyState`, `ItemsLine`, `Meter`, `Notice`, `Rich`, `SearchBox` (debounced `?q=`), `SelectBox` (bulk tick), `StatusBadge`, `Tag`, `Icon`, `CheckIcon` |
| `@/lib/money` · `@/lib/template` · `@/lib/dates` | `formatPaise`, `fill`, `isIsoDate` |

External: `next/link`, `next/navigation`. Tokens: `border-o500` (new-order edge), `border-o700` (selected), `bg-o50`, `text-o700`,
`text-red`, `bg-sunken`, `border-border(-strong)`, `shadow-raised`, `rounded-panel`, `rounded-card`, `text-h1`, `text-small-admin`,
`text-micro`, `h-pane`, `pb-safe`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminOrders      { dict: AdminCopy; queue: OrderQueue; filters: OrderFilters; pane: OrderDetailData | null }
OrdersHeader     { dict: OrdersCopy; capacity: CapacityData[]; filters }
CapacityMeters   { capacity; dict; className? }
OrdersFilterBar  { dict; filters; paneOpen }                 // paneOpen: stop sticking at 2xl so the pane can
CustomDateChip   { filters; label }
UnnotifiedBanner { orders: { id; code }[]; dict }
OrderBoard       { dict; groups (orders: BoardOrder[]); selectMode; exitSelectHref; paneOpen; currentId }
OrderGroupHeader { group; dict }
OrderCard        { order: BoardOrder; dict; selectMode; checked; onToggle }
OrderTable       { dict; paneOpen; children }
OrderTableRow    { order; dict; selectMode; checked; onToggle; paneOpen; current }
WhenLine         { fulfilmentType; pickupTime; dict }
BulkBar          { dict; selectedCount; verifiable; cancellable; pending; onVerify; onCancel }
```

## How it works

- **Data** — `loadOrderQueue(filters)` returns plain, pre-formatted data (times in the bakery's timezone). "New" = pending and
  under 15 minutes old. Within a day: pending first, then pickup time, then placed time.
- **Filters** — `?date=today,tomorrow|week|YYYY-MM-DD`, `?status=`, `?show=trusted,before,call`, `?q=`, `?order=` (pane),
  `?select=1`. Defaults are omitted, so `/admin/orders` is the default view.
- **Status changes** — `StatusMenu` and the bulk bar call `useOrderActions().request()`; the provider confirms and runs
  `transitionOrders`. Bulk Verify all only sends the selected pending orders; Cancel all only pending/verified.
- **Cards and table** are both rendered and swapped by CSS at `lg`, so there is no resize logic. The card's overlay link opens the
  order; phone, Call and the menu sit above it (`relative z-10`).
- **Split view (2xl)** — a code link with `?order=` opens the order in a sticky pane (`h-pane`); the table drops its phone,
  items, badges and actions columns while the pane is open.
- **Greyed** — completed, cancelled, no-show, and blocked-number orders render at 70% opacity.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column of cards; capacity under the title; chip rows scroll sideways |
| `md` (768, kitchen tablet) | two columns of cards; capacity beside the title; chip rows wrap |
| `lg` (1024) | table instead of cards |
| `2xl` (1600) | `?order=` opens the split pane (4/9 queue · 5/9 order); filter bar stops sticking |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.orders`, `admin.orderStatus`, `admin.orderTags` |
| A new filter | `src/lib/orders/filters.ts` (parse + href), `loadOrderQueue` in `src/lib/orders/queries.ts`, a chip row here |
| Sorting / "new" window | `loadOrderQueue` / `NEW_FOR_MS` in `queries.ts` |
| Table columns | `OrderTable.tsx` (header + width) and `OrderTableRow.tsx` (cell) together |

## Do not

- Merge pending quantities or counts into the verified capacity numbers.
- Build filter URLs by hand — use `filtersHref`.
- Format times in the browser; they arrive formatted in the bakery's timezone.
- Add a second status-change path that skips the provider's dialogs.
