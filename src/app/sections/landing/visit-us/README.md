# visit-us

The last band on `/`: where the shop is (with a Maps link), when it's open, and a tap-to-call number — from Settings → Bakery details.
Each row appears only when the owner has filled it in; with none, the band isn't rendered.

## Files in this folder

```
visit-us/
  VisitUs.tsx    entry (server) — heading and the definition list
  VisitRow.tsx   one label / value pair (dt muted left, dd right-aligned)
  copy.ts        hoursLines (runs of identical hours), mapHref (a Maps search URL)
  README.md
```

## Component tree

```
section (max-w-xl)
├─ h2#visit-us  dict.title
└─ dl
   ├─ VisitRow dict.address  → address lines + a "Map" link (new tab)
   ├─ VisitRow dict.hours    → hoursLines(): "Mon closed", "Tue–Fri, 7am–4pm", "Sat–Sun, 7am–6pm"
   └─ VisitRow dict.phone    → tel: link, formatForDisplay ("+91 98450 55012")
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/landing` | `LandingData["visit"]` — `{ address: string[]; phone; hours }` |
| `@/lib/settings/hours` | `hoursRuns`, `OpeningHours` |
| `@/lib/calendar/cutoffs` | `formatClock` — "7am" |
| `@/lib/phone` | `formatForDisplay` |
| `@/lib/template` | `fill` |

Tokens: `text-muted`, `text-o700` (links), `text-h2`, `max-w-xl`.

## Props

```ts
VisitUs  { visit: { address: string[]; phone: string | null; hours: OpeningHours | null }; dict: Dict["landing"]["visitUs"] }
VisitRow { label: string; children }
```

## Dictionary contract

```json
"visitUs": {
  "title", "address", "map", "mapLabel", "hours", "phone",
  "days": { "mon": "Mon", …, "sun": "Sun" },
  "range": "{first}–{last}", "open": "{days}, {from}–{to}", "closed": "{days} closed"
}
```

## How it works

- `hoursRuns` folds Monday-first consecutive days with identical hours (closed days compare equal whatever times they hold); hours
  stay hidden until the owner first saves them (`openingHours` is `{}` until then).
- The Maps link is a plain Google Maps search for the address — no API key, no embed, no geocoding; it opens the Maps app on a phone.
- Both links are 44px tall (`min-h-11`). Server Component.

## Responsive behavior

One layout at every width; the band caps at 576px (`max-w-xl`) so label and value stay close on wide screens.

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Labels, day abbreviations, hour formats | `src/content/en.json` → `landing.visitUs` |
| How hours are grouped | `hoursRuns` in [src/lib/settings/hours.ts](../../../../lib/settings/hours.ts), `hoursLines` in [copy.ts](copy.ts) |
| A map embed | it would be a heavy widget: `next/dynamic` inside `LazyOnView` (CLAUDE.md, Performance budget) |

## Do not

- Don't invent contact details when Settings has none — leave the row out.
- No inline `style`, no hardcoded strings.
