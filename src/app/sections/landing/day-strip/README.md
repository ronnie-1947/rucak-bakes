# day-strip

"Baking today" / "Tomorrow" on `/`: for each day, whether it still takes orders, how many order slots are left, a capacity bar, the
owner's note, and that day's items as cards with Add. Imported from `Bakery Order Landing.dc.html`. The runbook listed a
`today-strip` and a `tomorrow-strip`; the design tabs the two days in one band, so it is one band.

## Files in this folder

```
day-strip/
  DayStrip.tsx   entry (server) — picks the opening tab, renders both DayPanels into DayTabs
  DayTabs.tsx    "use client" — the tablist (44px Fraunces pills) and which panel shows
  DayPanel.tsx   one day: status pill + line, Meter, note, the item row (ItemCard × n)
  copy.ts        dayPill (text + tone), dayLine ("14 orders left · order by 6pm today")
  README.md
```

## Component tree

```
section aria-label=dict.label
└─ DayTabs tabs=[dict.today, dict.tomorrow] initial
   ├─ div[role=tablist] → button[role=tab] × 2
   └─ div[role=tabpanel] × 2 (the other hidden)
      └─ DayPanel day
         ├─ Tag size=pill  dayPill → dict.status.*        Available · Selling fast · Fully booked · Ordering closed · Closed · Menu soon · Paused
         ├─ span           dayLine → dict.left / leftOne / cutoff / full / closed / unplanned / paused
         ├─ Meter          taken of capacity (open and full days only), dict.meter
         ├─ p              day.note (the owner's public or closure note)
         └─ ul → li × n → ItemCard offer=dayOffer chip=dayChip day   (or dict.empty on a sunken box)
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `StoreDay`, `FEW_LEFT` |
| `@/lib/storefront/words` | `relativeDay`, `DayWords` |
| `@/components/item-card/*` | `ItemCard`, `dayOffer`, `dayChip` |
| `@/components/ui/*` | `Tag` (`size="pill"`), `Meter` |
| `@/lib/calendar/cutoffs` · `@/lib/template` | `formatClock`, `fill` |

Tokens: `bg-o500` (selected tab, ink text), `border-border`, `text-muted`, `bg-sunken`, `rounded-pill`, `rounded-card`, `font-display`,
`text-h2`, `text-small`; Meter's `fill-o500` / `fill-red`; breakpoints `md`, `lg`.

## Props

```ts
DayStrip { days: [StoreDay, StoreDay]; today: IsoDate; dict: Dict["landing"]["dayStrip"]; store: Dict["store"] }
DayTabs  { label: string; tabs: string[]; panels: ReactNode[]; initial: number }
DayPanel { day: StoreDay; today: IsoDate; dict: Dict["landing"]["dayStrip"]; store: Dict["store"] }
```

## Dictionary contract

```json
"dayStrip": {
  "label", "today", "tomorrow",
  "status": { "open", "few", "full", "cutoff", "closed", "unplanned", "paused" },
  "left": "{count} orders left · order by {time} {when}", "leftOne",
  "cutoff": "Orders for {day} closed at {time} {when}.", "full", "closed", "unplanned", "paused",
  "meter": "{taken} of {capacity} orders taken", "empty"
}
```

Exactly two tabs — `days` is a `[today, tomorrow]` tuple.

## How it works

- **Capacity is real** — `taken` counts live orders (pending + verified) against the day's `overbookLimit`, the limit `placeOrder`
  enforces at submit; `left` is the difference. "Selling fast" from 3 left. Verify-time capacity (`maxOrders`) is the owner's call
  on the phone, not the customer's concern.
- **Status order** follows `placeOrder`: paused › closed › past cutoff › full › open. Closed and unplanned days show no items.
- **Opening tab** — today when today takes orders, else tomorrow when that does (most days close the evening before), else today.
- **Tabs** — a real tablist: roving `tabIndex`, ← / → move and focus, `aria-controls` / `aria-labelledby`. Both panels are
  server-rendered; the hidden one keeps `hidden`. Selected = `o500` fill with ink text.
- **Item row** — on phones and tablets a snap-scrolling row that bleeds to the screen edge (`-mx-4 px-4`, `md:-mx-6 md:px-6`, the
  Container's gutters); from `lg` a 4-column grid that wraps.
- Server: `DayStrip`, `DayPanel`. Client: `DayTabs` (selection).

## Responsive behavior

| Width | Effect |
|---|---|
| base | cards 168px in a horizontal snap row, edge to edge |
| `md` 768px | cards 200px, bleed matches the 24px gutter |
| `lg` 1024px | 4-column grid, no scrolling |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Pill / line wording | `src/content/en.json` → `landing.dayStrip` |
| Pill colours | `pillTones` / `dayPill` in [copy.ts](copy.ts) |
| How capacity or status is worked out | `loadLanding` in [src/lib/storefront/landing.ts](../../../../lib/storefront/landing.ts) |
| Card width / columns | the `ul` / `li` classes in [DayPanel.tsx](DayPanel.tsx) |
| Which tab opens first | [DayStrip.tsx](DayStrip.tsx) |

## Do not

- Don't compute availability here — `StoreDay.status` already mirrors the submit rules.
- Don't show `maxOrders` to customers as the limit; the strip counts against what submit enforces.
- No inline `style`, no hardcoded strings, one component per file.
