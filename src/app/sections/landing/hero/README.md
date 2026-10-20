# hero

The top band of `/`: the owner's hero photo (Settings → Appearance) with the tagline on a warm `o500` band — under the photo on a phone, across its foot from `md`.

## Files in this folder

```
hero/
  Hero.tsx       entry (server) — photo layer, tagline band
  HeroPhoto.tsx  the photo (client) — next/image with a Cloudinary loader, so the srcset is sized per screen
  README.md
```

## Component tree

```
section.relative.isolate (rounded-sheet, bg-sunken)   flex column → md:block
├─ div  photo frame                                 4:3 → sm 16:9 → md fills the section
│  └─ HeroPhoto → Image fill preload (-z-10, cover) only when hero.image is set
└─ div  bg-o500                                     in flow below md, pinned to the bottom from md
   ├─ h1  hero.tagline ?? dict.fallback             text-glance → lg:text-glance-lg
   └─ p   dict.sub                                  "Order ahead, then pay when you collect."
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/storefront/landing` | `LandingData["hero"]` — `{ image, tagline }` |
| `./HeroPhoto` | the photo layer |
| `@/lib/cloudinary` | `imageUrl` — HeroPhoto's loader, uncropped, each srcset width capped at 2560px |

External: `next/image` (`fill`, `preload`, `loader`, `sizes`). Tokens: `rounded-sheet` (24px hero), `bg-sunken`, `bg-o500`,
`text-foreground`, `text-glance` / `text-glance-lg`, breakpoints `sm`, `md`, `lg`.

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
  because the frame is 4:3 on a phone, 16:9 from `sm` and 21:9 / 21:8 from `md`. Below `md` the band sits under the frame
  rather than over it, so none of the photo hides behind the tagline.
- Ink text on `o500`, never white (2.8:1). The `h1` takes Fraunces from the base layer.
- **Type** — the design's 32 / 38 / 44 / 52px headline is held to the locked scale: `text-glance` (32px) on phones and tablets,
  `text-glance-lg` (40px) from `lg`. Those tokens were added for the day sheet's quantities; this is their second use.
- **Photo size** — a Cloudinary loader gives next/image a srcset, and `sizes` follows the main Container's content width
  (full width below 1280px; 1216 / 1344 / 1536px from `xl` / `2xl` / `3xl`), so a phone fetches ~800px, not the full 2560.
  `preload` puts it in `<head>`: it's the page's largest paint. HeroPhoto is a client component only because a loader is a
  function, which can't be passed from a Server Component.
- Hero is a Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | photo frame 4:3, the band below it, `px-4 py-3` |
| `sm` 640px | photo frame 16:9 |
| `md` 768px | 21:9 section, the band laid across the photo's foot |
| `lg` 1024px | 21:8, band `px-8 py-4`, headline 40px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| The tagline itself | Settings → Bakery details (owner) |
| The photo | Settings → Appearance (owner) |
| Fallback / sub line | `src/content/en.json` → `landing.hero` |
| Proportions | the `aspect-*` classes on the photo frame (below `md`) and the section (from `md`) |

## Do not

- Don't put white text on the `o500` band.
- Don't add a hero type size outside the `@theme` scale.
- No inline `style`, no hardcoded strings.
