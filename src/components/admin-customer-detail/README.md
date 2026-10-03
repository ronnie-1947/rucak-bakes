# admin-customer-detail

One customer — `/admin/customers/[id]` ([page](<../../app/admin/(shell)/customers/[id]/page.tsx>)), and the customers list's
1600px split pane — imported from `Admin-customer-detail.dc.html`. Contact and Call within the first screen on a phone,
trust and block with their consequence lines, the counts, every order, plain-text patterns and the team's note.
Data: [src/lib/customers/detail.ts](../../lib/customers/detail.ts); writes: [src/app/actions/customers.ts](../../app/actions/customers.ts).

## Files in this folder

```
admin-customer-detail/
  AdminCustomerDetail.tsx  entry for the page (server) — CustomerActionsProvider (manual status) > CustomerDetail variant="page"
  CustomerDetail.tsx       the record, page or pane: header, history / patterns / note beside contact / flags / counts
  DetailHeader.tsx         back (page), name + CustomerFlags; "Open full record" in the pane
  ContactCard.tsx          the number (large tel link), Call + WhatsApp, NameField, delivery address + Open in Maps, Customer since
  NameField.tsx            "use client" — "Name  Meera Iyer ✎" → field + Save / Cancel; past orders keep their name
  FlagCard.tsx             "use client" — Trusted and Blocked switches, each with its line; the other rests while one is on; undo strip (page)
  FactsStrip.tsx           Total orders · Completed · Cancelled · No-shows (red when any), Total spent
  OrderHistory.tsx         "use client" — open orders (Active) first, then MonthGroup × n, 20 at a time + Show older orders
  MonthGroup.tsx           sticky "OCTOBER 2026 · 4 orders" over the month's rows
  HistoryRow.tsx           day, code (to the order) + ItemsLine, total + StatusBadge; the warm edge when still open
  RecentOrders.tsx         the pane's short history (5) + Open full record
  PatternsCard.tsx         "Usually orders: …", "Usually collects on Saturdays", "Average order: ₹420" (3+ orders that went ahead)
  NoteCard.tsx             "use client" — the one shared internal note, Save note
  types.ts                 AdminCopy, DetailCopy, DetailVariant
  README.md
```

## Component tree

```
AdminCustomerDetail dict=dict.admin customer
└─ CustomerActionsProvider statusPlacement="manual"          (src/components/customer-actions)
   └─ CustomerDetail variant="page"                          .customerDetail.*
      ├─ DetailHeader > CustomerFlags (src/components/customer-flags)
      ├─ OrderHistory > HistoryRow × live, MonthGroup × n > HistoryRow × n
      ├─ PatternsCard · NoteCard
      └─ (sticky side; first on phones) ContactCard > NameField · FlagCard > Switch × 2, CustomerActionsStatus · FactsStrip

CustomerDetail variant="pane" (inside the list's provider): DetailHeader, ContactCard, FlagCard, FactsStrip, RecentOrders, PatternsCard
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/customers/detail` | `loadCustomerDetail` → `CustomerDetailData`, `CustomerOrder`, `CustomerPatterns` |
| `@/lib/customers/limits` | `CUSTOMER_LIMITS` (name, note) |
| `@/app/actions/customers` | `renameCustomer`, `saveCustomerNote` (flags go through the provider) |
| `@/components/customer-actions/*` | provider, `CustomerActionsStatus` |
| `@/components/customer-flags/CustomerFlags` | the header's tags |
| `@/hooks/useCustomerActions` | the switches ask for flag changes |
| `@/components/ui/*` | `Button`/`buttonClasses`, `Container`, `ItemsLine`, `StatusBadge`, `Switch` (tone `danger` for Blocked), `Tag`, `TextInput`/`inputClasses`, `Icon` |

Tokens: `border-l-o500` + `Tag accent` (open orders), `text-o700` (number, totals, links), `bg-o500`/`bg-red` (switch tracks), `text-red`
(no-shows, blocked), `text-green` (saved), `rounded-panel/card`, `font-display` + `text-h2` (counts), breakpoints `md`, `lg`.

## Props

```ts
AdminCustomerDetail { dict: AdminCopy; customer: CustomerDetailData }
CustomerDetail      { customer; dict: AdminCopy; variant: "page" | "pane" }
DetailHeader        { customer; variant; dict: AdminCopy }
ContactCard         { customer; dict: DetailCopy["contact"] }
NameField           { customerId; name; dict: DetailCopy["contact"] }
FlagCard            { customer; dict: AdminCopy; showStatus }
FactsStrip          { facts; dict: DetailCopy["facts"] }
OrderHistory        { customer: { live; past; monthCounts }; dict: AdminCopy }
MonthGroup          { month; orders; count; dict: AdminCopy }
HistoryRow          { order: CustomerOrder; live; dict: AdminCopy }
RecentOrders        { customer: { id; live; past }; dict: AdminCopy }
PatternsCard        { patterns: CustomerPatterns; dict: DetailCopy["patterns"] }
NoteCard            { customerId; note; dict: DetailCopy["note"] }
```

## How it works

- **Counts**: Total orders is `orderCount` (moves at submit, so it includes cancelled ones); Completed and No-shows are the
  counters that move at those transitions; Cancelled is counted from the orders; Total spent is `totalSpentPaise` (completed only).
- **History**: pending / verified / ready orders first, framed and tagged Active; the rest newest first by fulfilment date, grouped
  by month. Each code opens the order.
- **Patterns** need three orders that went ahead (not cancelled or missed): the two items on most of them, the weekday they most
  often collect on, and the average order rounded to ₹10.
- **Trust / block**: mutually exclusive — while one is on, the other switch rests and says to take the first off. The trusted
  line says what it does given Settings → auto-verify. Every change confirms, then the undo strip shows inside this card.
- **Name**: edits the record only; orders keep the name they were placed under (a snapshot).
- **Address**: `Customer.address`, updated by each delivery order — shown with Open in Maps when there is one.
- **Not built from the design** (schema doesn't hold them; decided 3 Oct 2026): the threaded notes (one shared note instead, as on
  orders), the "Trusted by … on …" audit line and Activity log (no record of who flagged or when), Merge (one phone per
  customer, and no hard deletes) and Export orders.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | one column: contact, flags and counts first (Call within the first screen), then history, patterns, note |
| `md` (768, the 820px tablet) | history 60% · sticky contact column 40% |
| `lg`+ | wider gaps; `Container` caps the width |
| pane (list at 2xl) | one scrolling column inside the 60% pane |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.customerDetail`, `admin.customerFlags`, `admin.customerActions` |
| A count or pattern | `loadCustomerDetail` / `patternsOf` in `src/lib/customers/detail.ts` |
| Name / note limits | `src/lib/customers/limits.ts` |

## Do not

- Rewrite past orders' names when renaming.
- Let trusted and blocked both be on — the database refuses it (`c_trust_exclusive`).
