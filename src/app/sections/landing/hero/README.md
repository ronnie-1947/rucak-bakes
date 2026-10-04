# hero

The top band of `/`: the owner's hero photo (Settings → Appearance) with the tagline on a warm `o500` band across its foot.

## Files in this folder

```
hero/
  Hero.tsx    entry (server) — photo layer, tagline band
  README.md
```

## Component tree

```
section.relative.isolate (rounded-sheet, bg-sunken)
├─ Image fill priority (-z-10, object-cover)        only when hero.image is set
└─ div  bg-o500, bottom
   ├─ h1  hero.tagline ?? dict.fallback             text-glance → lg:text-glance-lg
   └─ p   dict.sub                                  "Order ahead, then pay when you collect."
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/landing` | `LandingData["hero"]` — `{ image, tagline }` |
| `@/lib/cloudinary` | `imageUrl` (uncropped, 2560px wide) |

External: `next/image` (`fill`, `priority`, `unoptimized`). Tokens: `rounded-sheet` (24px hero), `bg-sunken`, `bg-o500`,
`text-foreground`, `text-glance` / `text-glance-lg`, breakpoints `md`, `lg`.

## Props

```ts
Hero { hero: { image: string | null; tagline: string | null }; dict: Dict["landing"]["hero"] }
```

## Dictionary contract

```json
"hero": { "fallback": "…shown when Settings has no tagline", "sub": "…the line under the tagline" }
```

## How it works

- The photo is decorative (`alt=""`) — the tagline carries the meaning. Cloudinary delivers it uncropped and `object-cover` crops it,
  because the frame is near-square on a phone and 21:9 / 21:8 wider up.
- Ink text on `o500`, never white (2.8:1). The `h1` takes Fraunces from the base layer.
- **Type** — the design's 32 / 38 / 44 / 52px headline is held to the locked scale: `text-glance` (32px) on phones and tablets,
  `text-glance-lg` (40px) from `lg`. Those tokens were added for the day sheet's quantities; this is their second use.
- Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | at least 360px tall (`min-h-90`), the band 16px padded |
| `md` 768px | 21:9, no minimum height |
| `lg` 1024px | 21:8, band `px-8 py-6`, headline 40px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| The tagline itself | Settings → Bakery details (owner) |
| The photo | Settings → Appearance (owner) |
| Fallback / sub line | `src/content/en.json` → `landing.hero` |
| Proportions | the `aspect-*` / `min-h-*` classes on the section |

## Do not

- Don't put white text on the `o500` band.
- Don't add a hero type size outside the `@theme` scale.
- No inline `style`, no hardcoded strings.
