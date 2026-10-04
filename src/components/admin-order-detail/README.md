# admin-order-detail

One order, everything needed to act on it. Rendered full-page at `/admin/orders/[id]`
([page](<../../app/admin/(shell)/orders/[id]/page.tsx>)) and as the 2xl split pane inside the orders queue.

## Files in this folder

```
admin-order-detail/
  OrderDetail.tsx     entry (server) — wraps everything in an OrderActionsProvider; `page` | `pane` variant
  Timeline.tsx        Pending → Verified → Ready → Completed with times; green when done, orange for current
  ClosedBlock.tsx     replaces the timeline once cancelled / no-show: who, when, why
  CustomerCard.tsx    name, big tel: link, Call + WhatsApp, tags, last three orders, View customer
  CustomerNote.tsx    the customer's note — orange-bordered warm block, semibold. Allergies live here.
  ItemsTable.tsx      snapshot lines (unit, qty large, line), subtotal / delivery fee / total
  FulfilmentFacts.tsx pickup or delivery, day, time, address + Open in Maps
  InternalNote.tsx    "use client" — the team's note, saved on demand (saveInternalNote)
  ActivityLog.tsx     <details> — placed / verified by / ready / collected / cancelled by, from the order's timestamps
  OrderMenu.tsx       "use client" — ⋯ Print, Copy details, Cancel order
  ActionBar.tsx       "use client" — over-capacity line, then the exit (Cancel / No-show) and the next step
  AddedBar.tsx        "use client" — from New order (?added=1): "BK-4830 added for Meera — verified" + Add another (UndoBar)
  copy-text.ts        the plain-text summary for "Copy details"
  types.ts            AdminCopy, DetailCopy, DetailVariant
  README.md
```

## Component tree

```
OrderActionsProvider
└─ article (frames[variant])
   ├─ Link "All orders" (page only)                 .back
   ├─ header: h1|h2 code · StatusBadge · Tag "By staff · Anjali" · OrderMenu   .byStaff · .print · .copy · .cancelOrder
   ├─ body
   │  ├─ AddedBar (page, ?added=1, staff order)     .added · .addAnother · .dismiss
   │  ├─ Notice error (isSuspected)                 .suspected
   │  ├─ Notice warm (notificationFailed)           .unnotified
   │  ├─ ClosedBlock | Timeline                     .closed* | orderStatus.* · .now
   │  ├─ CustomerCard → OrderTagList                .callButton · .whatsapp · .firstOrder · .history* · .viewCustomer
   │  ├─ CustomerNote (if any)                      .customerNote
   │  ├─ ItemsTable                                 .itemsTable.* · .quantity · .customPrice · .menuPrice · .subtotal · .deliveryFee · .totalAtPickup
   │  ├─ FulfilmentFacts                            .facts.*
   │  ├─ InternalNote                               .internalNote* · .save · .saved · .saveFailed
   │  └─ ActivityLog                                .activity · .activityKinds.*
   └─ ActionBar                                     .next.* · .secondary.* · .overCapacity · .completedLine
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/orders/queries` | `OrderDetailData` (from `loadOrderDetail`) |
| `@/components/order-actions/OrderActionsProvider` | dialogs + transitions |
| `@/hooks/useOrderActions` | `request()` in ActionBar / OrderMenu |
| `@/app/actions/orders` | `saveInternalNote` |
| `@/components/order-tag-list/OrderTagList` | customer facts |
| `@/lib/orders/status` | `canTransition` (menu's Cancel) |
| `@/components/ui/*` | `Button`/`buttonClasses`, `Notice`, `StatusBadge`, `Icon`, `CheckIcon` |

Tokens: `border-o500` + `bg-o50` (customer note), `bg-green`/`border-green` (done steps), `bg-o500` (current step), `text-o700`,
`text-red`, `bg-red-soft`, `bg-sunken`, `shadow-raised`, `rounded-panel`, `text-h1`, `text-h2`, `text-micro`, `pb-safe`.

## Props

```ts
OrderDetail     { order: OrderDetailData; dict: AdminCopy; variant: "page" | "pane"; backHref?; added? }
AddedBar        { orderId; code; name; dict: DetailCopy }
Timeline        { timeline; status; dict }
ClosedBlock     { closed; dict: DetailCopy }
CustomerCard    { customer; dict }
CustomerNote    { note; label }
ItemsTable      { order: Pick<…, "lines" | "subtotalPaise" | "deliveryFeePaise" | "totalPaise">; dict }
FulfilmentFacts { order: Pick<…, "fulfilmentType" | "dayLabel" | "relative" | "pickupTime" | "deliveryAddress">; dict }
InternalNote    { orderId; note; dict }                     // keyed by order id so the pane resets between orders
ActivityLog     { activity; dict }
OrderMenu       { target; status; copyText; dict }
ActionBar       { target; status; overCapacity; completedAt; dict; variant }
```

## How it works

- **Next step** — PENDING → "Verify order" (exit: Cancel), VERIFIED → "Mark ready" (exit: Cancel), READY → "Mark collected"
  (exit: No-show). Terminal orders show no buttons; completed shows "Collected <time>".
- **Over capacity** — a pending order whose verify would exceed the day's maxOrders shows the red line before the owner taps;
  the provider's CapacityDialog still confirms.
- **Customer note** never truncates or collapses — it may be an allergy.
- **Activity** is derived from `createdAt`, `verifiedAt`(+by; no `by` = auto-verified), `readyAt`, `completedAt`, `cancelledAt`(+by).
  A staff order (7R.5) starts "Added by Anjali" instead of "Order placed by customer".
- **Staff orders** — the header carries "By staff · {first name}". A line priced by hand shows a "Custom price" tag, its price in
  o700 and "menu ₹1,500" under it (`OrderItem.menuPricePaise`). Arriving from New order (`?added=1`) the page shows AddedBar;
  dismissing it drops `?added` from the URL, a reload keeps it.
- **No-show trail** — the schema has one "closed unfulfilled" trail: `cancelledAt` / `cancelledById` / `cancellationNote` record a
  no-show too; `status` says which.
- **Internal note** — one shared text per order (the schema's `internalNote`), not the design's threaded list.
- **Print** uses `print:hidden` on the menu, back link and action bar.

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`xs` | Call / WhatsApp split the card width; action bar sticky at the bottom of `main` |
| `xs`+ | Call / WhatsApp fixed 128px beside the name |
| page, `md`+ | content capped at `max-w-3xl` |
| pane (2xl) | header fixed, body scrolls, action bar pinned at the pane's foot |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.orderDetail` |
| What's loaded | `loadOrderDetail` in `src/lib/orders/queries.ts` |
| Next-step labels / which exit | `NEXT` / `EXIT` in `ActionBar.tsx`, copy in `admin.orderDetail.next/secondary` |

## Do not

- Hide or shorten the customer note.
- Change status anywhere but through `useOrderActions().request()`.
- Show prices from the menu — lines are snapshots.
