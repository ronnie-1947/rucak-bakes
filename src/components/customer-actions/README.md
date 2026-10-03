# customer-actions

Every trust / block change on a customer, wherever it's asked for: the customers list's ⋯ menus
(`src/components/admin-customers`) and the record's switches (`src/components/admin-customer-detail`). One confirm per
change — naming the customer and number and saying what changes for their orders — then the server action, then a
green undo strip.

## Files in this folder

```
customer-actions/
  CustomerActionsProvider.tsx  "use client" — context (useCustomerActions), the confirm, setCustomerFlag, the undo strip
  CustomerActionsStatus.tsx    "use client" — failure Notice + UndoBar (ui), wherever a screen places them
  FlagDialog.tsx               "use client" — "Mark Meera Iyer as trusted?" … Cancel · Mark trusted (Block number is red)
  types.ts                     ActionsCopy
  README.md
```

## Props

```ts
CustomerActionsProvider { dict: ActionsCopy; autoVerifyTrusted: boolean; statusPlacement?: "top" | "manual"; children }
CustomerActionsStatus   { dict }
FlagDialog              { change: FlagChange; target: CustomerTarget; autoVerifyTrusted; dict; pending; onClose; onConfirm }
```

Callers use `useCustomerActions()` from `src/hooks/useCustomerActions.ts`: `request(change, { id, name, phoneDisplay })`.

## How it works

- **Changes**: `trust`, `untrust`, `block`, `unblock` (`FlagChange`, `src/lib/customers/changes.ts`). Trusted and blocked are
  mutually exclusive — the database's `c_trust_exclusive` — so `changeFlag` refuses to trust a blocked number or block a
  trusted one, and callers only offer the changes that are allowed. The owner takes one flag off before putting the other on.
- **What the confirm says** depends on Settings → auto-verify: with it on, trusting means "verified automatically, no call";
  with it off, the number just shows as trusted and still waits for the call.
- **Blocking** never refuses orders: they're accepted and flagged (`isSuspected`), and the customer sees nothing different.
- **Undo** puts the two flags back exactly as they were (`restoreFlags`). The change is guarded on the flags it read, so a change
  made meanwhile on another screen is refused rather than overwritten (the failure notice says to refresh).

## Do not

- Delete a customer — block them (non-negotiable 7).
- Offer "Mark trusted" on a blocked number, or "Block" on a trusted one.
