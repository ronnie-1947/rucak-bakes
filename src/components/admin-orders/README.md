# admin-orders

The orders queue at `/admin/orders` ([page](<../../app/admin/(shell)/orders/page.tsx>)) — imported from `Admin-orders.dc.html`.
Default view: **Upcoming** — today onward, grouped by date, pending first (§10R: every order is booked ahead). Filters live in the URL ([src/lib/orders/filters.ts](../../lib/orders/filters.ts)),
so every choice of the Date / Status / Show selects is a URL and a filtered view survives refresh and back. Revised 4 Oct with
the design: selects instead of chip rows, search in the header, sticky day bands, and the round + for a manual order.

## Files in this folder

```
admin-orders/
  AdminOrders.tsx        entry (server) — header, filter bar, banner, empty states, board, 2xl split pane
  OrdersHeader.tsx       h1, capacity meters, SearchToggle (phones) + Select / Done (a link toggling ?select=1), then the search row
  SearchToggle.tsx       <768: the 44px search button — a checkbox the header reads with group-has-checked, no JavaScript
  CapacityMeters.tsx     today / tomorrow verified vs maxOrders, Meter bar, red "· full"
  OrdersFilterBar.tsx    sticky, a fixed 82px: DateFilter, Status and Show FilterSelects, Clear (phones) / Clear filters
  FilterSelect.tsx       "use client" — a labelled SelectField whose choices are URLs; highlighted (`tone="active"`) when not the default
  DateFilter.tsx         "use client" — Upcoming · Today · Tomorrow · This week · Custom date… (a hidden native date input's picker)
  UnnotifiedBanner.tsx   warm notice linking pending orders whose Telegram notification failed
  OrderBoard.tsx         "use client" — day groups; cards <1024, table ≥1024; bulk selection state
  OrderGroupHeader.tsx   "Today · Fri 2 Oct — 9 orders" … "5/10 verified" — a sticky band over the cards, or the table's day row content
  OrderCard.tsx          "use client" — one order on phones/tablets; overlay link, Call + StatusMenu
  OrderTable.tsx         the ≥1024 table: one sticky header row (column widths), separate borders, a <tbody> per day; TABLE_COLUMNS
  OrderTableGroup.tsx    one day of the table: its sticky day row (th colgroup) and its rows
  OrderTableRow.tsx      "use client" — one row; code links to the page (<2xl) or the pane (2xl)
  WhenLine.tsx           "Pickup 11:30" / "Delivery"
  CustomLines.tsx        lines staff priced by hand — "Custom birthday cake ₹1,200 per kg · menu ₹1,500"
  BulkBar.tsx            "use client" — sticky bottom: N selected · Cancel all · Verify all
  NewOrderFab.tsx        the round 56px + → /admin/orders/new, sticky at the foot of the queue column (not in select mode)
  types.ts               AdminCopy, OrdersCopy, OrderLinks, BoardOrder
  README.md
```

## Component tree

```
AdminOrders dict=dict.admin queue filters pane
├─ OrdersHeader  (group/search)         .title · .select/.done · .searchLabel/.searchPlaceholder
│  ├─ CapacityMeters (md+ beside h1, below it on phones)  .today/.tomorrow · .capacity · .capacityFull
│  ├─ SearchToggle (<md)
│  └─ SearchBox (md+; phones while toggled or ?q=)
├─ OrdersFilterBar                      .filters.date/.status/.show · .dates.* · .customDate · .statuses.* · .showAll · .toggles.* · .clear/.clearShort
│  ├─ DateFilter > FilterSelect > SelectField (ui) + hidden date input
│  ├─ FilterSelect (status) · FilterSelect (show)
│  └─ Clear (when not the default view)
├─ UnnotifiedBanner                     .unnotified/.unnotifiedOne
├─ EmptyState (.emptyToday + View tomorrow | .emptyFiltered + Clear filters)
│  or OrderActionsProvider > OrderBoard
│     ├─ cards (lg:hidden): section per day: OrderGroupHeader variant="cards" (sticky)
│     │  └─ OrderCard × n  (1 col, 2 from md)  → CustomLines, OrderTagList, StatusMenu, SelectBox
│     ├─ table (hidden <lg): OrderTable (sticky thead) > OrderTableGroup per day (sticky day row > OrderGroupHeader variant="table")
│     │  └─ OrderTableRow × n → CustomLines   .customLine
│     └─ BulkBar (select mode)          .selected · .verifyAll · .cancelAll
├─ NewOrderFab (not select mode), last in the queue column   .addOrder
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
| `@/components/ui/*` | `Button`/`buttonClasses`, `ButtonLink` (also the round + — primary, pill), `EmptyState`, `ItemsLine`, `Meter`, `Notice`, `Rich`, `SearchBox` (debounced `?q=`), `SelectField` (its `active` tone), `SelectBox` (bulk tick), `StatusBadge`, `Tag`, `Icon`, `CheckIcon` |
| `@/lib/money` · `@/lib/template` · `@/lib/dates` | `formatPaise`, `fill`, `isIsoDate` |

External: `next/link`, `next/navigation`. Tokens: `border-o500` (new-order edge), `border-o700` (selected), `bg-o50`, `text-o700`,
`text-red`, `bg-sunken`, `border-border(-strong)`, `shadow-raised`, `rounded-panel`, `rounded-card`, `text-h1`, `text-small-admin`,
`text-micro`, `h-pane`, `pb-safe`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminOrders      { dict: AdminCopy; queue: OrderQueue; filters: OrderFilters; pane: OrderDetailData | null }
OrdersHeader     { dict: OrdersCopy; capacity: CapacityData[]; filters }
SearchToggle     { label; open }
CapacityMeters   { capacity; dict; className? }
OrdersFilterBar  { dict; filters; paneOpen }                 // paneOpen: stop sticking at 2xl so the pane can
FilterSelect     { label; value; options: FilterOption[] ({ value; label; href | null }); active; onPick?; className? }
DateFilter       { filters; dict: OrdersCopy["filters"]; className? }
UnnotifiedBanner { orders: { id; code }[]; dict }
OrderBoard       { dict; groups (orders: BoardOrder[]); selectMode; exitSelectHref; paneOpen; currentId }
OrderGroupHeader { group; dict; variant: "cards" | "table" }
OrderCard        { order: BoardOrder; dict; selectMode; checked; onToggle }
OrderTable       { dict; paneOpen; children }                // children: OrderTableGroup × days
OrderTableGroup  { group; dict; paneOpen; children }
OrderTableRow    { order; dict; selectMode; checked; onToggle; paneOpen; current }
WhenLine         { fulfilmentType; pickupTime; dict }
CustomLines      { lines: CustomLine[]; dict: AdminCopy; className? }
BulkBar          { dict; selectedCount; verifiable; cancellable; pending; onVerify; onCancel }
NewOrderFab      { label }
```

## How it works

- **Data** — `loadOrderQueue(filters)` returns plain, pre-formatted data (times in the bakery's timezone). "New" = pending and
  under 15 minutes old. Within a day: pending first, then pickup time, then placed time.
- **Filters** — `?date=upcoming|today|tomorrow|week|YYYY-MM-DD`, `?status=`, `?show=trusted|before|call`, `?q=`, `?order=` (pane),
  `?select=1`. Defaults are omitted, so `/admin/orders` is the default view. Three selects, one value each: Date (Upcoming —
  open-ended, `fulfilmentDate >= today` — Today, Tomorrow, This week, Custom date…), Status (All + each status), Show (All
  customers, Trusted only, Ordered before, Needs call). A select that isn't on its default is highlighted; Clear appears once
  anything (a search included) narrows the list. Custom date… opens the platform's date picker on a hidden input
  (`showPicker`, else focus + click); the picked date then shows as its own option. Older links with lists
  (`?date=today,tomorrow`) still filter; the select shows the first. Groups are the dates that have orders. Empty default view:
  "No orders from today on yet…".
- **Search** — in the header, not the sticky bar: always from 768px; on phones behind the search button, open from the start
  when the URL has `?q=`. The button is a checkbox; the row shows via `group-has-checked/search` — no JavaScript, so opening it
  doesn't focus the field.
- **Sticky** — the filter bar sticks at the top at a fixed 82px (`h-20.5`) so what sticks under it needs no measuring: the card
  day bands (`top-20.5`), the table's header row (`top-20.5`) and its day rows (`top-30.5`, under the 40px header). With the 2xl
  pane open the bar is static, and the table's offsets drop to `top-0` / `top-10`. The table uses separate borders: an
  overflow-hidden rounded wrapper would stop its rows sticking.
- **Status changes** — `StatusMenu` and the bulk bar call `useOrderActions().request()`; the provider confirms and runs
  `transitionOrders`. Bulk Verify all only sends the selected pending orders; Cancel all only pending/verified.
- **Cards and table** are both rendered and swapped by CSS at `lg`, so there is no resize logic. The card's overlay link opens the
  order; phone, Call and the menu sit above it (`relative z-10`).
- **Split view (2xl)** — a code link with `?order=` opens the order in a sticky pane (`h-pane`); the table drops its phone,
  items, badges and actions columns while the pane is open.
- **Greyed** — completed, cancelled, no-show, and blocked-number orders render at 70% opacity.
- **Staff orders (7R.5)** — the round + (NewOrderFab, "Add a manual order") opens `/admin/orders/new`. It is the last thing in the
  queue column, sticky at the foot of the scroll area — above the tab bar on phones, clear of the 2xl pane's action bar, pushed
  down by `mt-auto` on a short list — and gone in select mode, where the bulk bar takes the foot. An order staff entered carries "By staff · Anjali"
  and, when a line was priced by hand, "Custom price" (`OrderTagList`) plus `CustomLines` under the items.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column of cards; capacity under the title; search behind the button; the three selects share the bar's row (their text truncates at 320px), "Clear" |
| `md` (768, kitchen tablet) | two columns of cards; capacity beside the title; search always shown; selects 180px each, "Clear filters" |
| `lg` (1024) | table instead of cards |
| `2xl` (1600) | `?order=` opens the split pane (4/9 queue · 5/9 order); filter bar stops sticking |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.orders`, `admin.orderStatus`, `admin.orderTags` |
| A new filter | `src/lib/orders/filters.ts` (parse + href), `loadOrderQueue` in `src/lib/orders/queries.ts`, a FilterSelect in `OrdersFilterBar.tsx` |
| The filter bar's height | `h-20.5` in `OrdersFilterBar.tsx` and every `top-20.5` / `top-30.5` under it (OrderGroupHeader, OrderTable, OrderTableGroup) |
| Sorting / "new" window | `loadOrderQueue` / `NEW_FOR_MS` in `queries.ts` |
| Table columns | `OrderTable.tsx` (header + width) and `OrderTableRow.tsx` (cell) together |

## Do not

- Merge pending quantities or counts into the verified capacity numbers.
- Build filter URLs by hand — use `filtersHref`.
- Format times in the browser; they arrive formatted in the bakery's timezone.
- Add a second status-change path that skips the provider's dialogs.
- Wrap the table (or the board) in anything `overflow-hidden` — the header row and day rows would stop sticking.
- Change the filter bar's height without moving the `top-*` offsets under it.
