# close-day-dialog

The confirm that opens when the owner closes a day that already has orders — from a week card's Open switch
(`src/components/admin-calendar`) or the day editor's Day status (`src/components/admin-calendar-day`). It lists
every live order by code and customer (each a link to the order) and says what closing does: it stops new
orders, and the ones already placed stay as they are — the owner calls those customers.

## Files in this folder

```
close-day-dialog/
  CloseDayDialog.tsx   "use client" — Dialog (ui) naming the orders; Keep open · Close day (red)
  README.md
```

## Props

```ts
CloseDayDialog { day: string; orders: DayOrder[]; dict: Dict["admin"]["closeDay"]; pending: boolean; onClose; onConfirm }
```

`DayOrder` comes from `src/lib/calendar/week.ts`. The server re-checks: `updateDay` and `saveMenuDay` refuse to
close a day with orders unless `confirmClose` is sent, and hand back the fresh list (`HAS_ORDERS`) when orders
arrived after the screen loaded — so the dialog can open even when the page thought the day was empty.

## Do not

- Cancel the orders from here. Closing a day never touches its orders.
