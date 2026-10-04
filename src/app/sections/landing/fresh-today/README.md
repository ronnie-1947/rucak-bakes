# fresh-today

"Fresh today" on `/` (§10R): today's **counter-items** only — what the bakery baked for the counter this morning, which customers
walk in for (or call to have kept aside) and can't order online. Orders booked for today never appear here. Imported from
`Bakery Order Landing.dc.html`.

## Files in this folder

```
fresh-today/
  FreshToday.tsx   entry (server) — heading + status pill; the walk-in line, Call and the cards; or the sunken message
  copy.ts          freshPill, freshLine, freshMessage — dict strings filled
  README.md
```

## Component tree

```
section
├─ h2#fresh-today  dict.title  ·  Tag size=pill  freshPill()
├─ (on / sold out)
│  ├─ p freshLine()  ·  CallLink (ui) "Call +91 98765 43210"      only with a public phone
│  └─ ul.grid → li × n → ItemCard (item-card)  chip "Sold out" + muted when the counter ran out
└─ (orders only / closed)  p.bg-sunken freshMessage()
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `FreshToday`, `CounterItem` (via `loadLanding`) |
| `@/lib/storefront/words` | `relativeDay` — "back tomorrow", "back Tuesday" |
| `@/lib/calendar/cutoffs` | `formatClock` — "till 4pm" |
| `@/lib/phone` | `formatForDisplay` |
| `@/components/item-card/ItemCard` | the cards (no action — each opens its item page) |
| `@/components/ui/*` | `CallLink`, `Tag` |

Tokens: `text-h2`, `bg-sunken`, `rounded-card`; Tag tones `green` / `red` / `quiet`; breakpoints `md`, `lg`.

## Props

```ts
FreshToday { fresh: FreshToday; today: IsoDate; phone: string | null; dict: Dict["landing"]["freshToday"]; store: Dict["store"] }
```

## Dictionary contract

```json
"freshToday": {
  "title", "pill": { "on": "On the counter till {time}", "onAllDay", "soldOut", "none", "closed" },
  "walkIn", "walkInUntil": "Walk in until {time}.", "walkInOnly", "soldOut", "none",
  "closed": "Closed today — back {day}. …", "closedNoBack", "call": "Call {phone}"
}
```

Also `store.item` (card strings, "Sold out") and `store.days`.

## How it works

| State (`fresh.state`) | Pill | Body |
|---|---|---|
| `on` — counter-items today | "On the counter till 4pm" (green; "On the counter today" without saved hours) | "Walk in, or call and we’ll keep some aside." + Call + the cards |
| `soldOut` — every one sold out | "All sold out" (red) | "The counter’s empty for today — order ahead from the menu below." + Call + the faded cards |
| `none` — open, no counter-items | "Orders only today" (quiet) | sunken "Nothing extra on the counter today — we’re baking orders. …" |
| `closed` — closed today | "Closed today" (quiet) | sunken "Closed today — back {Tuesday}. …" (the next open date in the window, else without it) |

- The cards are `ItemCard` without an action: photo, name, the counter's price for the day (override included). A sold-out one has
  the red "Sold out" chip and is faded — it still opens its page, where it can be ordered ahead.
- No public phone → no Call button, and the line reads "Walk in until 4pm." (or "Walk in while we’re open." without hours).
- "Till 4pm" is today's closing time from the opening hours (`counterCloses` in `src/lib/storefront/counter.ts`). Sold out is the
  Calendar's `soldOutAt`. Inactive and archived counter-items are left out. Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | heading and pill share a row (wrap at 320px); line above the Call button; 2 columns |
| `md` 768px | 3 columns |
| `lg` 1024px | 4 columns |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Any wording | `src/content/en.json` → `landing.freshToday` |
| Which state, which items | `loadLanding` in [src/lib/storefront/landing.ts](../../../../lib/storefront/landing.ts) |
| The closing time | `counterCloses` in [src/lib/storefront/counter.ts](../../../../lib/storefront/counter.ts) |

## Do not

- Don't put Add on these cards — counter-items aren't ordered online.
- Don't show today's online orders here; Fresh today is the counter only.
- No inline `style`, no hardcoded strings.
