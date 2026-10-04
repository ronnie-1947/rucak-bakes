# how-it-works

Three steps on a sunken panel on `/` — pick, send, we call to confirm. It is the promise that replaces a checkout: no account, no
payment, a phone call before anything is final.

## Files in this folder

```
how-it-works/
  HowItWorks.tsx   entry (server) — panel, heading, the ordered list
  HowStep.tsx      one step: 32px o50 tile with an o500 glyph, bold title, muted line
  README.md
```

## Component tree

```
section (bg-sunken, rounded-card)
├─ h2#how-it-works  dict.title
└─ ol → HowStep × 3   icon = ICONS[i] (check, send, phone), dict.steps[i].title / .text
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/components/ui/icons/Icon` | `Icon`, `IconName` |

Tokens: `bg-sunken`, `rounded-card`, `rounded-chip`, `bg-o50`, `text-o500` (a decorative glyph, not text), `text-muted`, `text-h2`,
`text-small`; breakpoint `lg`.

## Props

```ts
HowItWorks { dict: Dict["landing"]["howItWorks"] }
HowStep    { icon: IconName; title: string; text: string }
```

## Dictionary contract

```json
"howItWorks": { "title": "How it works", "steps": [{ "title", "text" }, { … }, { … }] }
```

The glyphs are matched to `steps` by position — three of them. A fourth step gets the check glyph until `ICONS` grows.

## How it works

Server Component, no state. The glyph tiles are `aria-hidden`; the list is an `ol` because the order matters. The "within 2 hours"
promise must match the cart's expectation block (runbook 6.3).

## Responsive behavior

| Width | Effect |
|---|---|
| base | steps stacked, 16px apart; panel `px-4 py-6` |
| `lg` 1024px | three columns, 32px apart; panel padded 32px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Wording | `src/content/en.json` → `landing.howItWorks` |
| Glyphs | `ICONS` in [HowItWorks.tsx](HowItWorks.tsx) (names from `ui/icons/Icon.tsx`) |

## Do not

- Don't promise a call-back time here that the cart screen doesn't also say.
- No inline `style`, no hardcoded strings.
