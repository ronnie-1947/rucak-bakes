# admin-login

The staff sign-in screen at `/admin/login` ([src/app/admin/login/page.tsx](../../app/admin/login/page.tsx)). Google is the only
way in; the card's job is to make every way that can go wrong legible — above all a refusal, which names the Google
account that was used, because a browser signed into a personal account is the usual cause.

Imported from the `Login.dc.html` design.

## Files in this folder

```
admin-login/
  AdminLogin.tsx     entry (server) — wordmark, the card, the back-to-shop footer
  Wordmark.tsx       bakery name, orange underline on the last word
  LoginForm.tsx      "use client" — the form: status, the submit button, keep-signed-in, help
  LoginStatus.tsx    the block above the button, one per LoginState
  LoginActions.tsx   the one submit button the state calls for, with its "Opening Google…" pending face
  TroubleSignIn.tsx  "use client" — the "Trouble signing in?" link and its Dialog
  HelpSteps.tsx      the numbered list inside that dialog
  types.ts           LoginState, LoginCopy, OwnerPhone
  README.md
```

## Component tree

```
AdminLogin                                   main, centred column, gap-8
├─ Wordmark  name=bakeryName                  settings.bakeryName (falls back to dict.meta.home.title)
├─ section (card, max-w-100)
│  ├─ h1                                      dict.admin.login.title
│  ├─ p                                       .subtitle
│  └─ LoginForm                               form → actions/auth.ts signInWithGoogle
│     ├─ input[hidden] callbackUrl
│     ├─ LoginStatus state                    .rejected.* · .network · .failed · .cancelled · .expired
│     ├─ LoginActions state pending           .google · .tryDifferent · .retry · .opening
│     ├─ p                                    .approvedOnly
│     ├─ div[inert while pending] > Checkbox  .keep.label · .keep.hint  (name="keep")
│     └─ div[inert while pending] > TroubleSignIn
│        └─ Dialog > HelpSteps                .help.title · .help.close · .help.steps[] · .help.call
└─ footer                                    bakeryName · Link "/" .back
```

## Dependencies

**Internal**

| Import | Purpose |
|---|---|
| `@/app/actions/auth` | `signInWithGoogle` — sets the keep cookie, redirects to Google |
| `@/components/ui/Button` | every button — `outline`, `outlineAccent`, `link` variants |
| `@/components/ui/Checkbox` | keep me signed in |
| `@/components/ui/Dialog` | the help sheet / dialog |
| `@/components/ui/Notice` | the error / warm / quiet status blocks |
| `@/components/ui/Rich` | bold email and destination, the tel: link, inside dict sentences |
| `@/components/ui/Spinner` | pending face of the submit button |
| `@/lib/i18n` | `Dict` for `LoginCopy` |

**External** — `next/link`, `next/image` (`/google-g.svg`), `next/navigation` (`unstable_rethrow`), React `useActionState`, `useState`.

**Custom theme tokens** — `bg-background`, `bg-sunken`, `border-border`, `border-o500`, `text-o700`, `text-muted`, `text-h1`,
`text-small`, `font-display`, `rounded-card`, `rounded-panel`, breakpoint `md`, `lg`; via primitives `bg-red-soft`, `border-red`,
`bg-o50`, `bg-scrim`, `shadow-raised`, `ease-sheet`, `pb-safe-lg`.

## Props

```ts
AdminLogin    { dict: LoginCopy; bakeryName: string; ownerPhone: OwnerPhone; state: LoginState; email: string | null; destination: string; callbackUrl: string }
Wordmark      { name: string }                                   // last word underlined
LoginForm     { dict; state; email; destination; callbackUrl; ownerPhone }  // state is the URL's; a failed submit overrides with "network"
LoginStatus   { state; dict; email; destination }                // email: the refused Google account; destination: translated section name
LoginActions  { state; dict; pending: boolean }                  // which single submit button, and whether it shows "Opening Google…"
TroubleSignIn { dict: LoginCopy["help"]; ownerPhone }
HelpSteps     { dict: LoginCopy["help"]; ownerPhone }            // adds the call step only when ownerPhone is set
```

## How it works

- **States** (`LoginState`) come from the URL, mapped in [login-state.ts](../../app/admin/login/login-state.ts):
  `NotApproved` → `rejected` (red block naming `?email=`, button becomes "Try a different account"), `OAuthCallbackError` →
  `cancelled` (muted line — nothing went wrong), `Configuration` → `network` (red block + Try again), any other error →
  `failed`, `reason=expired` → `expired` (orange-50 line naming the destination). `network` is also raised client-side when
  the server action itself can't be reached (`useActionState` catches the throw).
- **Try a different account** submits `chooser=1`; the action passes `prompt=select_account` to Google so the account
  picker opens instead of silently reusing the personal account.
- **Keep me signed in** (default on) — the action stores the choice in a 15-minute `bakery.keep-signed-in` cookie;
  the `jwt` callback in `src/auth.ts` reads it once when the token is minted. Unticked, the session gets a hard
  `endsAt` 12 hours out instead of Auth.js's 30 days.
- **Already signed in** — the page redirects to `callbackUrl` (sanitised to a path under `/admin` by `safeAdminPath`).
- **Pending** — the button shows a spinner and "Opening Google…"; keep and help are `inert` and dimmed to 45%.
- **Server vs client** — `AdminLogin`, `Wordmark`, `HelpSteps` are server-safe; `LoginForm` and `TroubleSignIn` are the
  client leaves (`LoginStatus` and `LoginActions` render inside `LoginForm`, so they ship to the client too).
- **Accessibility** — one `h1`; error blocks are `role="alert"`, the others `role="status"`; the Google button autofocuses
  only in the clean `ready` state; every tap target ≥ 44px; the dialog is a native `<dialog>` (focus trap, Escape).

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` (320–767) | card padding 24px; help opens as a bottom sheet (under 640) |
| `sm` (640+) | help is a centred 440px dialog |
| `md`–`lg` (768–1023, the kitchen tablet) | card padding 32px; the keep-signed-in row sits in a sunken bordered box |
| `lg`+ | keep box returns to plain; the card stays 400px — it does not grow |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | File |
|---|---|
| Copy | `src/content/en.json` → `admin.login` |
| A new error value from Auth.js | `src/app/admin/login/login-state.ts`, then `LoginStatus.tsx` / `LoginActions.tsx` if it needs its own look |
| Keep-signed-in duration | `SHORT_SESSION_MS` in `src/auth.ts` |
| Button looks | variants in `src/components/ui/Button.tsx` — never local classes here |
| Help steps | `admin.login.help.steps` (the call step is added from `settings.publicPhone`) |

## Do not

- Phrase a refusal as "access denied", "unauthorised", or a status code.
- Toast an error — every state is an inline block.
- Add a second submit button visible at once; `LoginActions` renders exactly one.
- Put inline `style`, raw hex or user-facing literals in these files.
- Trust `callbackUrl` without `safeAdminPath`.
