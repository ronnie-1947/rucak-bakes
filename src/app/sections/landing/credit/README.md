# credit

The last line of `/`: who built the app — "App baked by **Ripunjoy Buddha** · ripunjoybuddha.com" — small, muted and centred under a
rule, with a link to the developer's site.

## Files in this folder

```
credit/
  Credit.tsx   entry (server) — the flame glyph, the line, the link
  README.md
```

## Component tree

```
footer .border-t.text-small.text-muted
├─ span  Icon flame · dict.lead + strong dict.name
├─ span[aria-hidden] "·"
└─ a[target=_blank]  dict.site → https://ripunjoybuddha.com
```

## Dependencies

| Import | Purpose |
|---|---|
| `@/components/ui/icons/Icon` | `flame` — the oven, for "baked" |

Tokens: `border-border`, `text-small`, `text-muted`, `text-foreground`, `text-o700`.

## Props

```ts
Credit { dict: Dict["landing"]["credit"] }
```

## Dictionary contract

```json
"credit": { "lead": "App baked by", "name": "Ripunjoy Buddha", "site": "ripunjoybuddha.com" }
```

## How it works

- On the landing page only, not in the store shell: the item page and the cart pin their own action bar to the bottom of a phone,
  and a shell footer would sit under it.
- The link's target is the `SITE` constant in `Credit.tsx`; `dict.site` is only what it reads.
- Server Component.

## Responsive behavior

| Width | Effect |
|---|---|
| base | the line and the link wrap onto two centred lines at 320px; one line from ~375px |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## Do not

- Don't make it louder than the bakery's own content — no fills, no headings.
- No inline `style`, no hardcoded strings.
