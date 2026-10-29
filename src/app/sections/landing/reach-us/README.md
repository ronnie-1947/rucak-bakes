# reach-us

The band right under the hero on `/`: one warm card with a line of copy, the **Call** button and the bakery's **Instagram** and
**Facebook**. Each appears only when the owner has filled it in (Settings → Bakery details); with none of the three the band
disappears.

## Files in this folder

```
reach-us/
  ReachUs.tsx     entry (server) — the card, the line, Call and the social links
  SocialLink.tsx  one outline button with the Instagram or Facebook glyph; opens in a new tab
  README.md
```

## Component tree

```
section[aria-label] .rounded-card.bg-o50.border-o200   pulled 16px (md 24px) up toward the hero
├─ p   dict.callLine (with a phone) | dict.followLine (socials only)
└─ div
   ├─ CallLink (ui) variant=primary size=lg  "Call +91 94357 09287"     only with a public phone
   └─ div → SocialLink × 0–2                  "Instagram", "Facebook"     only those with a link
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/types` | `StoreSocial` — full links, null when not set (via `loadLanding`) |
| `@/lib/settings/social` | `SOCIAL_KINDS` (the order: Instagram, then Facebook), `SocialKind` |
| `@/lib/phone` | `formatForDisplay` |
| `@/components/ui/CallLink`, `Button` (`buttonClasses`), `icons/Icon` | the buttons; glyphs `phone`, `instagram`, `facebook` |

Tokens: `rounded-card`, `bg-o50`, `border-o200`, Button variants `primary` / `outlineLink`, size `lg` (48px); breakpoints `sm`, `md`, `lg`.

## Props

```ts
ReachUs { phone: string | null; social: { instagram: string | null; facebook: string | null }; dict: Dict["landing"]["reachUs"] }
```

## Dictionary contract

```json
"reachUs": { "label", "callLine", "followLine", "call": "Call {phone}", "instagram": "Instagram", "facebook": "Facebook" }
```

## How it works

- Settings stores the handle only (`settings.instagram`, `settings.facebook`) — `socialPath` in
  [src/lib/settings/social.ts](../../../../lib/settings/social.ts) strips a pasted link or an `@`. `loadLanding` turns each into
  `https://www.instagram.com/<handle>` / `https://www.facebook.com/<path>`, or null.
- Saving Bakery details revalidates `/`, so a new link shows on the next load.
- Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | the line, then Call full width, then the social buttons sharing a row (each half) |
| `sm` 640px | Call and the social buttons on one row, each its own width |
| `md` 768px | 24px under the hero rather than 16px |
| `lg` 1024px | the line on the left, the buttons on the right, `px-8` |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| The phone, the handles | Settings → Bakery details (owner) |
| Any wording | `src/content/en.json` → `landing.reachUs` |
| Another network | `SocialKind` + the regexes in `src/lib/settings/social.ts`, a column on `Settings`, a glyph in `Icon.tsx` |

## Do not

- Don't show an icon for a network without a link.
- Don't put the Call button back in Fresh today — this band is the landing page's one Call.
- No inline `style`, no hardcoded strings.
