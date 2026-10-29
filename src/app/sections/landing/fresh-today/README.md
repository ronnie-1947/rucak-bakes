# fresh-today

"Fresh today" on `/` (§10R): today's **counter-items** only — what the bakery baked for the counter this morning, which customers
walk in for (or call to have kept aside) and can't order online. Orders booked for today never appear here. Imported from
`Bakery Order Landing.dc.html`. Shown only on a day with something on the counter: `loadLanding` returns `fresh: null` otherwise
(orders only, or closed), and the page leaves the band out. The Call button lives in [reach-us/](../reach-us/), under the hero.

## Files in this folder

```
fresh-today/
  FreshToday.tsx   entry (server) — heading + status pill; the walk-in line and the cards
  copy.ts          freshPill, freshLine — dict strings filled
  README.md
```

## Component tree

```
section
├─ h2#fresh-today  dict.title  ·  Tag size=pill  freshPill()
├─ p freshLine()
└─ ul.grid → li × n → ItemCard (item-card)  chip "Sold out" + muted when the counter ran out
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `FreshToday`, `CounterItem` (via `loadLanding`) |
| `@/lib/calendar/cutoffs` | `formatClock` — "till 4pm" |
| `@/components/item-card/ItemCard` | the cards (no action — each opens its item page) |
| `@/components/ui/Tag` | the status pill |

Tokens: `text-h2`; Tag tones `green` / `red`; breakpoints `md`, `lg`.

## Props

```ts
FreshToday { fresh: FreshToday; hasPhone: boolean; dict: Dict["landing"]["freshToday"]; store: Dict["store"] }
```

## Dictionary contract

```json
"freshToday": {
  "title", "pill": { "on": "On the counter till {time}", "onAllDay", "soldOut" },
  "walkIn", "walkInUntil": "Walk in until {time}.", "walkInOnly", "soldOut"
}
```

Also `store.item` (card strings, "Sold out").

## How it works

| State (`fresh.state`) | Pill | Body |
|---|---|---|
| `on` — counter-items today | "On the counter till 4pm" (green; "On the counter today" without saved hours) | "Walk in, or call and we’ll keep some aside." + the cards |
| `soldOut` — every one sold out | "All sold out" (red) | "The counter’s empty for today — order ahead from the menu below." + the faded cards |
| — nothing on the counter, or closed | | no band (`fresh` is null) |

- The cards are `ItemCard` without an action: photo, name, the counter's price for the day (override included). A sold-out one has
  the red "Sold out" chip and is faded — it still opens its page, where it can be ordered ahead.
- No public phone → the line reads "Walk in until 4pm." (or "Walk in while we’re open." without hours), never "call".
- "Till 4pm" is today's closing time from the opening hours (`counterCloses` in `src/lib/storefront/counter.ts`). Sold out is the
  Calendar's `soldOutAt`. Inactive and archived counter-items are left out. Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | heading and pill share a row (wrap at 320px); the line; 2 columns |
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
