# admin-customers

The customers list at `/admin/customers` ([page](<../../app/admin/(shell)/customers/page.tsx>)) — imported from
`Admin-customers.dc.html`. **Search is the point of the screen**: full width, never collapsed, matching any part of a
number however it's typed (or a name), through the trigram indexes. An empty result for a number says "This number hasn’t
ordered before" — that is the answer, not a failure. A shopkeeper's notebook, not a CRM: no charts, no scoring, no avatars.
View state lives in the URL ([src/lib/customers/filters.ts](../../lib/customers/filters.ts)); data:
[src/lib/customers/queries.ts](../../lib/customers/queries.ts).

## Files in this folder

```
admin-customers/
  AdminCustomers.tsx      entry (server) — header, filter bar, flag provider, status, empty states | board, capped line, 2xl pane
  CustomersHeader.tsx     "Customers" + "12 customers · 3 trusted · 1 blocked"
  CustomersFilterBar.tsx  sticky: SearchBox (ui, × and hint), Show chips (ChipLink), Sort (LinkSelect)
  CustomerBoard.tsx       cards and table, swapped by CSS; with the pane open, one column of cards at 2xl
  CustomerCard.tsx        name + flags, tel link, "12 orders · last on 3 Oct · 2 no-shows", usual item, Call, ⋯ — red edge at 2+ no-shows
  CustomerTable.tsx       the ≥1024 table shell (Name · Phone · Orders · Last order · No-shows · Flags · actions)
  CustomerTableRow.tsx    one row; the name opens the record
  CustomerMenu.tsx        "use client" — ⋯: View, then Mark trusted / Block, or the one way back for a flagged number
  copy.ts                 historyText, noShowsText, isWarned
  types.ts                AdminCopy, CustomersCopy, BoardCustomer
  README.md
```

## Component tree

```
AdminCustomers dict=dict.admin list filters pane
├─ CustomersHeader                             .customers.title · .count
├─ CustomersFilterBar (when there are customers) > SearchBox, ChipLink × 6, LinkSelect (ui)
└─ CustomerActionsProvider (src/components/customer-actions), status placed manually
   ├─ CustomerActionsStatus — the undo strip / failure notice
   ├─ EmptyState (.emptyAll | .notFoundTitle/.notFoundBody + Clear search | .noMatchTitle + Clear filters)
   │  or CustomerBoard
   │     ├─ CustomerCard × n > CustomerFlags (src/components/customer-flags), CustomerMenu
   │     └─ CustomerTable > CustomerTableRow × n > CustomerFlags, CustomerMenu
   ├─ "Showing 100 of 142 — search to find the rest."
   └─ aside (2xl, when ?customer=) > CustomerDetail variant="pane"   (src/components/admin-customer-detail)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/customers/queries` | `loadCustomerList` → `CustomerList`, `CustomerRow` (`LIST_LIMIT`) |
| `@/lib/customers/filters` | parse / build URLs (`customersHref`), `looksLikeNumber` |
| `@/lib/customers/detail` | `CustomerDetailData` for the pane |
| `@/components/customer-actions/*` | provider + status: confirm, `setCustomerFlag`, undo |
| `@/components/customer-flags/CustomerFlags` | Trusted / Blocked / New tags |
| `@/components/admin-customer-detail/CustomerDetail` | the 2xl pane |
| `@/hooks/useCustomerActions` · `@/hooks/useDismiss` | flag requests · ⋯ dismissal |
| `@/components/ui/*` | `buttonClasses`, `ButtonLink`, `ChipLink`, `EmptyState`, `LinkSelect`, `SearchBox`, `Icon` |

Tokens: `border-l-red`/`bg-red-soft`/`text-red` (2+ no-shows), `border-o700`/`bg-o50` (the customer in the pane), `text-o700` (numbers,
Call), `bg-sunken` (table head), `shadow-raised` (sticky bar), `rounded-panel/card`, `h-pane`, breakpoints `md`, `lg`, `2xl`.

## Props

```ts
AdminCustomers     { dict: AdminCopy; list: CustomerList; filters: CustomerFilters; pane: CustomerDetailData | null }
CustomersHeader    { total; trusted; blocked; dict: CustomersCopy }
CustomersFilterBar { dict; filters; paneOpen }
CustomerBoard      { customers: BoardCustomer[]; dict: AdminCopy; paneOpen }
CustomerCard       { customer: BoardCustomer; dict: AdminCopy }
CustomerTable      { dict: CustomersCopy; children }
CustomerTableRow   { customer: BoardCustomer; dict: AdminCopy }
CustomerMenu       { customer: CustomerRow; pageHref; dict: AdminCopy; direction?: "down" | "up" }
```

## How it works

- **Search** (`?q=`, 300ms after typing stops): digits are pulled out of the query (spaces, dashes, `+91`, a leading 0 all
  ignored) and matched anywhere in `phoneE164`; the text is matched anywhere in `lower(name)`. Both run on the trigram
  indexes (`customers_phone_trgm`, `customers_name_trgm`) — `EXPLAIN` shows a BitmapOr of the two. `%` and `_` are literal.
- **Show** (one at a time): All · Trusted · Ordered before (2+ orders) · New this month (first order since the 1st, bakery
  time) · Has no-shows · Blocked. **Sort**: Recent order (latest `lastOrderAt`) · Most orders · Name A–Z.
- **New** tag: first order in the last 7 days. **Usually orders**: the item on most of their orders that went ahead.
- **Up to 100 rows** (`LIST_LIMIT`); beyond that a line says how many matched and to search.
- **Flags**: the ⋯ menu offers only allowed changes (trusted and blocked are mutually exclusive); each confirms, then leaves an
  undo strip at the top of the list (`src/components/customer-actions`).
- **Opening a customer**: below 1600px the card or name goes to `/admin/customers/[id]`; from 1600px a card opens the split pane
  (`?customer=`), list 40% · record 60%.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column of cards; Show chips scroll sideways; Call + ⋯ on each card |
| `md` (768, the 820px tablet) | two columns of cards; chips wrap |
| `lg` (1024) | the table; search beside the chips |
| `2xl` (1600) | with `?customer=`: one column of cards (40%) beside the sticky pane (60%); the filter bar stops sticking |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.customers`, `admin.customerFlags`, `admin.customerActions` |
| A Show chip or sort | `showChoices` / `sortChoices` in `src/lib/customers/filters.ts`, `showWhere` / `orderBy` in `queries.ts`, the dict |
| What search matches | `searchIds` in `src/lib/customers/queries.ts` (keep it to shapes the trigram indexes cover) |

## Do not

- Collapse the search behind an icon on phones.
- Add charts, scores or avatars.
- Delete a customer — block them.
