# order-actions

Every order status change in the admin goes through here — the queue's status menus and bulk bar, and the order detail's
action bar and ⋯ menu. One provider per screen owns the confirm dialogs and the server action, so cancel, no-show and
over-capacity confirms look and behave the same everywhere.

## Files in this folder

```
order-actions/
  OrderActionsProvider.tsx  entry, "use client" — context provider; runs transitionOrders; renders the dialogs and the stale notice
  StatusMenu.tsx            "use client" — the per-order dropdown: current status ticked, then only the legal next moves
  ReasonDialog.tsx          "use client" — cancel / no-show confirm: names each order, states the consequence, requires a reason
  CapacityDialog.tsx        "use client" — "Verify over capacity?" naming "order 11 of 10 for Sat 3 Oct" and the orders
  types.ts                  OrdersCopy, OverCapacity, OpenDialog
  README.md
```

The context and `useOrderActions()` live in [src/hooks/useOrderActions.ts](../../hooks/useOrderActions.ts).

## Component tree

```
OrderActionsProvider dict=dict.admin.orders
├─ Notice (stale / invalid)                       .stale {codes} · .invalid
├─ children  ← anything calling useOrderActions().request(targets, to, onDone?)
├─ ReasonDialog kind=cancel|noShow                .dialogs.cancel* / noShow* / reason / reasonRequired / keep
│  └─ Dialog > ul(code · name) · consequence · Chip × reasons
└─ CapacityDialog                                 .dialogs.overTitle / overLine / overOk / notNow
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/app/actions/orders` | `transitionOrders`, `TransitionResult` |
| `@/hooks/useOrderActions` | context, `ActionTarget` |
| `@/lib/orders/status` | `TRANSITIONS` — the menu only offers legal moves |
| `@/components/ui/*` | `Dialog`, `Button`, `Chip`, `Notice`, `Icon`, `CheckIcon` |

Tokens: `bg-o700`/`text-background` (pending trigger), `border-border-strong`, `bg-o50` (current item), `text-red`, `shadow-raised`,
`rounded-panel`, `rounded-chip`, `rounded-button`.

## Props

```ts
OrderActionsProvider { dict: OrdersCopy; children }
StatusMenu           { target: ActionTarget; status: OrderStatus; label: string; statusLabels; className? }
ReasonDialog         { kind: "cancel" | "noShow"; targets; dict; pending; onClose; onConfirm(reason) }
CapacityDialog       { over: OverCapacity; targets; dict; pending; onClose; onConfirm() }
```

## How it works

- `request(targets, to)`: CANCELLED / NO_SHOW open `ReasonDialog`; VERIFIED / READY / COMPLETED run immediately.
- The action answers `CAPACITY_EXCEEDED` with the over-capacity orders per day → `CapacityDialog`; "Verify anyway" re-runs
  them with `force`. Orders that did fit were already verified.
- `STALE` (someone else moved it first) closes any dialog and shows an inline red notice naming the codes. Never a toast.
- The action revalidates the admin layout, so the screen and the pending badge refresh without `router.refresh()`.
- All client. Menus close on outside pointerdown and Escape; dialogs are native `<dialog>`.

## Responsive behavior

Dialogs: bottom sheet under 640px, centred 440px from `sm`. The status menu opens below its trigger, right-aligned, 200px.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Reasons / dialog copy | `src/content/en.json` → `admin.orders.dialogs` |
| Which moves are legal | `TRANSITIONS` in `src/lib/orders/status.ts` (and the server enforces it in `lifecycle.ts`) |
| What a move does to the DB | `src/lib/orders/lifecycle.ts` |

## Do not

- Call `transitionOrders` directly from a component — go through `request()` so the confirms always run.
- Offer a move the state machine doesn't allow.
- Cancel or mark a no-show without a reason.
