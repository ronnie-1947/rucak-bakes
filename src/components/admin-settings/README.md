# admin-settings

The settings screen at `/admin/settings` ([page](<../../app/admin/(shell)/settings/page.tsx>)), imported from `Admin-settings.dc.html`.
It has five sections, chosen by `?section=` ([src/lib/settings/sections.ts](../../lib/settings/sections.ts)), and each saves on its own.
**Owners** change settings. **Staff** see everything with the controls switched off, and every action re-checks the role
(`requireOwner`). Domain code lives in [src/lib/settings/](../../lib/settings/) and the actions in
[src/app/actions/settings.ts](../../app/actions/settings.ts).

## Files in this folder

```
admin-settings/
  AdminSettings.tsx      entry (server) — list + pane grid; phones show one or the other, 768px+ both; LeaveGuard around it all
  LeaveGuard.tsx         "use client" — the open section's unsaved-change count, the leave dialog, beforeunload (context: hooks/useSettingsLeave)
  LeaveDialog.tsx        "Leave without saving? 2 changes to Bakery details will be lost."
  GuardedLink.tsx        "use client" — a link out of the section that the guard can stop; the open section's own entry is unguarded
  DirtyDot.tsx           "use client" — the warm dot on the open section's list entry while it has changes
  SectionList.tsx        "Settings" + five SectionLinks; sticky beside the pane from 768px
  SectionLink.tsx        phones: 64px card with the saved state ("Telegram needs attention" in red) + chevron; 768px+: 48px row, open one marked
  SectionHeader.tsx      back arrow (phones, guarded), section title + intro
  SettingsPane.tsx       picks the open section's component
  PaneGrid.tsx           a section's body: fields in one @container (pairs at 576px), live preview column from 1280px (60/40); fieldset disabled for staff
  FormFrame.tsx          save bars (top 1280px+, bottom below) while there are changes, "Saved · 11:02" after a save
  SaveBar.tsx            status + Discard + Save changes; `top` / `bottom` placements
  SaveStatus.tsx         "3 unsaved changes" / "Fix 1 problem to save", and why the last save failed
  useSectionForm.ts      a form section's state: values vs saved, problems, change count (→ LeaveGuard), save / discard
  useLiveSave.ts         a switch that saves on flip: optimistic value, "✓ Saved" for 3s or a failure line
  LiveMark.tsx           "SAVES INSTANTLY" tag + the mark
  InlinePreview.tsx      a sunken "Preview" box under the fields it shows — below 1280px only
  layout.ts              `fullRow` — the class for a field that takes the whole row
  BakerySection.tsx      "use client" — name, tagline (60, counter), PhoneField, address (+ Open in Maps), HoursField; landing preview
  PhoneField.tsx         +91 prefix, ten digits
  HoursField.tsx         seven DayHoursRows, "Copy Monday's hours to every day", "not shown yet" until first saved, link to Ordering rules
  DayHoursRow.tsx        Open/Closed switch and from–to selects; one line once the box is 512px wide
  OrderingSection.tsx    "use client" — defaults note, max / overbook / cutoff / order-ahead, AutoVerifySwitch, FulfilmentField, delivery radius + fee, PauseZone
  StepperField.tsx       label, Stepper, consequence line (red on a rule break)
  CutoffField.tsx        time + "which day" selects, and the example sentence in ink
  FulfilmentField.tsx    Pickup / Delivery checkboxes; at least one
  AutoVerifySwitch.tsx   "use client" — live switch
  PauseZone.tsx          "use client" — the danger zone: reason (required, locked while paused), live danger switch, landing preview line
  PauseDialog.tsx        "Pause all ordering now?" quoting what customers will read
  OrderPagePreview.tsx   the customer's day picker with these rules
  NotificationsSection.tsx  TelegramCard + "only new orders send a message"; phone preview. No save bar
  TelegramCard.tsx       "use client" — connected / not connected (steps) / failing (red) / not set up; Connect, Send test, Disconnect, Reconnect
  ConnectSteps.tsx       four steps, today's code, "Open @bot" deep link — never a chat-id field
  DisconnectDialog.tsx   the confirm for Disconnect
  TelegramPreview.tsx    a sample new-order message
  StaffSection.tsx       "use client" — StaffRows, Add someone, outcome notice; roles preview
  StaffRow.tsx           name + You, Google email, role · last sign-in, Remove
  AddStaffDialog.tsx     name, Google email, RoleChoice → addStaffMember
  RoleChoice.tsx         Staff / Owner cards (native radios)
  RemoveStaffDialog.tsx  "Remove Ravi?" confirm
  RolesPreview.tsx       what each role can do — as enforced
  AppearanceSection.tsx  "use client" — HeroPicker (saves on upload), announcement switch + text (120), currency and timezone (fixed); landing preview
  HeroPicker.tsx         16:9 pick → Cloudinary upload with progress → saved at once; Replace / Remove
  FixedSetting.tsx       a locked, read-only value with why
  LandingPreview.tsx     the landing page top: banner, name, hero + tagline, contact line with today's hours
  copy.ts                saveText, errorText, cutoff sentences, todayHoursText, fulfilmentText, landingBanner, sectionSummary
  types.ts               AdminCopy, SettingsCopy
  README.md
```

## Component tree

```
AdminSettings dict=dict.admin data=SettingsPageData
└─ LeaveGuard (→ LeaveDialog)
   └─ Container grid
      ├─ SectionList → SectionLink × 5 → GuardedLink, DirtyDot
      └─ pane: SectionHeader → GuardedLink · Notice (staff) · SettingsPane key=section
         ├─ bakery:        FormFrame → SaveBar×2 · PaneGrid → fields, InlinePreview × 2, PhoneField, HoursField → DayHoursRow × 7 | LandingPreview
         ├─ ordering:      FormFrame · PaneGrid → Notice, StepperField × 3(+2), CutoffField, AutoVerifySwitch → LiveMark, FulfilmentField,
         │                 PauseZone → LiveMark, PauseDialog | OrderPagePreview
         ├─ notifications: PaneGrid → TelegramCard key=state → ConnectSteps, DisconnectDialog | TelegramPreview
         ├─ staff:         PaneGrid → StaffRow × n, AddStaffDialog → RoleChoice, RemoveStaffDialog | RolesPreview
         └─ appearance:    FormFrame · PaneGrid → HeroPicker, Switch, Field, InlinePreview, FixedSetting × 2 | LandingPreview
```

Copy: `dict.admin.settings` throughout; `dict.admin.cutoffs` for the list's cutoff summary.

## Dependencies

| Import | Purpose |
|---|---|
| `@/lib/settings/queries` | `loadSettingsPage` → `SettingsPageData`, `StaffMember` |
| `@/lib/settings/form` | values types, `*Problems`, `*Changes`, `tidy*`, limits — the rules the actions re-check |
| `@/lib/settings/hours` | `WEEK`, `HOUR_TIMES`, `OpeningHours`, `hoursProblem`, `weekdayKey` |
| `@/lib/settings/sections` | `settingsSections`, `sectionHref` |
| `@/lib/settings/telegram` | `TelegramState`, `ConnectSteps` (types only on the client) |
| `@/app/actions/settings` | every save, the two live switches, the hero photo (`saveHeroImage`), Telegram connect / test / disconnect, add / remove staff |
| `@/app/actions/cloudinary` | `getUploadSignature`, `deleteImage` (an uploaded hero whose save failed) |
| `@/hooks/useSettingsLeave` | the LeaveGuard's context |
| `@/lib/calendar/cutoffs` · `@/lib/calendar/form` | `formatClock`, `cutoffLabel` · `withMaxOrders` (shared with the Calendar) |
| `@/components/ui/*` | `Button`, `Checkbox`, `Container`, `Dialog`, `Field`, `Notice`, `SelectField`, `Stepper` (now with `step` / `display`), `Switch`, `TextInput`, icons |

External: `next/image` (Cloudinary + blob, `unoptimized`), `next/link`, `next/navigation`. Tokens: `bg-o50`/`border-o200`/`bg-o500` (open entry,
dirty dot, hero overlay, chosen role), `text-o700`, `border-red`/`bg-red-soft`/`text-red` (problems, danger zone, failing Telegram),
`bg-green-soft`/`text-green` (connected, Saved), `bg-sunken`, `rounded-panel/card/chip/field/pill`, `shadow-raised` (save bars), `pb-safe`,
`ease-sheet`, container sizes `@lg` / `@xl`, breakpoints `xs`, `md`, `lg`, `xl`.

## Props

```ts
AdminSettings      { dict: AdminCopy; data: SettingsPageData }
LeaveGuard         { sectionTitle; dict: leave; children }
LeaveDialog        { section; changes; dict; onClose; onLeave }
GuardedLink        { href; className?; current?; aria-label?; children }
DirtyDot           { label }
SectionList        { data; dict; className? }
SectionLink        { href; title; summary: Summary; icon; current; dirtyLabel }
SectionHeader      { title; intro; backHref; backLabel }
SettingsPane       { data; dict: SettingsCopy }   — and every *Section takes the same
PaneGrid           { canEdit; preview?; where?; dict: preview; children }
FormFrame          { form: SaveControls & { dirty; savedAt }; canEdit; dict: save; children }
SaveBar            { form: SaveControls; placement: "top" | "bottom"; dict }
SaveStatus         { problemCount; changes; problem; dict }
InlinePreview      { label; children; className? }
PhoneField         { value; onChange; error?; dict }
HoursField         { hours; onChange; unsaved; error?; dict }
DayHoursRow        { day; hours: DayHours; times; invalid; onChange; dict }
StepperField       { id; label; hint; error?; value; min; max; step?; display?; onChange; decreaseLabel; increaseLabel; children?; className? }
CutoffField        { time; days; onChange; dict }
FulfilmentField    { pickup; delivery; onChange; error?; dict }
AutoVerifySwitch   { on; dict }
PauseZone          { pause: { paused; reason }; dict }
PauseDialog        { reason; dict; onClose; onConfirm }
OrderPagePreview   { values: OrderingValues; today; dict }
TelegramCard       { state: TelegramState; canEdit; dict }
ConnectSteps       { steps: ConnectSteps; dict }
DisconnectDialog   { pending; dict; onClose; onConfirm }
TelegramPreview    { bakeryName; connected; dict }
StaffRow           { person: StaffMember; canEdit; onRemove; dict }
AddStaffDialog     { dict; onClose; onAdded(name, restored) }
RoleChoice         { value: StaffRole; onChange; dict }
RemoveStaffDialog  { name; pending; dict; onClose; onConfirm }
RolesPreview       { dict }
HeroPicker         { value; onChange: (publicId | null) => Promise<boolean>; overlay; dict }
FixedSetting       { label; value; hint; fixed }
LandingPreview     { name; tagline; phone; address; hours | null; heroImage; banner: Banner | null; today; dict }
LiveMark           { mark; dict }
```

## How it works

- **Sections** — `?section=` names the open one. Without it, phones show the list and 768px+ opens Bakery details beside it. The pane is
  keyed by section, so switching remounts it. The list's lines are the saved state, worked out on the server (`sectionSummary`).
- **Forms** — Bakery details, Ordering rules and Appearance each run `useSectionForm`. Problems show as soon as they exist and hold Save
  back ("Fix 1 problem to save"), so Save can never send something the server would refuse. The bar appears only while there are
  changes. A save sends the trimmed values, the action re-validates with zod and revalidates the whole app (these settings show on
  customer pages), and the fresh server values become the new baseline.
- **Leaving** — the open form reports its change count to the `LeaveGuard`. Another section's link or Back opens the leave dialog, a reload
  or tab close gets the browser's prompt, and the dot marks the entry. Links elsewhere in admin (the sidebar) aren't intercepted.
- **Saves instantly** — Auto-verify and Pause ordering are outside the forms. Each flips at once (`useOptimistic`), shows "✓ Saved"
  for 3 seconds, and falls back if the save fails. Pausing needs a reason and a confirm that quotes it. Resuming takes one tap and
  keeps the reason for next time. While paused the reason is locked, so the preview always matches what customers see.
- **Defaults** — max orders, the overbook limit and the cutoff are what a *new* day starts from (`newDay` in `calendar/writes.ts`).
  Planned days keep theirs, which the warm note says, linking to the Calendar. Raising max past the overbook limit raises the limit too
  (`withMaxOrders`, as in the Calendar), and the overbook stepper can't go below max.
- **Opening hours** — `Settings.openingHours` `{ mon: { open, from, to }, … }`. Until first saved the form shows 8am–8pm every day and says
  customers see nothing yet. "Copy … to every day" copies the first open day's times and leaves open / closed alone.
- **Telegram** — no chat-id field. The owner sends the bot today's code (`connectCode`: 6 characters from an HMAC of `AUTH_SECRET` and the
  date; yesterday's still works), either typed or by the `t.me/<bot>?start=CODE` link. **Connect** reads the bot's last day of messages
  (`getUpdates`) for it, stores that chat and sends a hello. Every send is recorded (`recordDelivery`: `telegramLastSentAt`, or
  `telegramFailedAt` + Telegram's description), and the card turns red when the last send after connecting failed and nothing has
  got through since. Send test either clears that or confirms it. With no `TELEGRAM_BOT_TOKEN` the card says the bot isn't set up.
  `TELEGRAM_CHAT_ID` is still `notifyOwner`'s fallback when no chat is connected.
- **Staff** — Add puts a Google address on the allowlist; there's no invite email, since sign-in is Google-only. A removed address comes
  back with the new name and role, and one that already has access is refused. Remove sets `isActive = false` (signed out on their next
  request) after a confirm — never yourself, never the last owner (checked in a serializable transaction).
- **Hero photo** — not part of the Appearance form. It goes straight to Cloudinary under a server signature, and the moment the upload
  returns its public_id, `saveHeroImage` writes it to `settings.heroImage` and revalidates the app — no Save press, so leaving the screen
  can't lose it. Remove saves at once the same way. The photo a save replaces is deleted by the action once nothing uses it; an upload
  whose save fails is deleted by the section and the picker says "The photo didn't save".

## Responsive behavior

| Width | Effect |
|---|---|
| `xxxs`–`sm` | list, or one section full-screen with a back arrow; save bar sticks to the bottom (clear of the home indicator); dialogs are sheets |
| `md` (768, kitchen tablet) | list 200px + section (~330px at 820); fields one column |
| `lg` (1024) | list 240px; hours rows go to one line once the box is 512px |
| `xl` (1280) | live preview column (60/40), save bar moves to a sticky top bar, inline previews go |
| `2xl`+ | fields pair up (phone, radius + fee, currency + timezone) once their column reaches 576px; Container caps the width |

Test at `xxxs` (320px) and `3xl` (1920px+) any time you touch this component.

## How to make changes

| Goal | Where |
|---|---|
| Copy | `src/content/en.json` → `admin.settings` (+ `telegram.connected`, `telegram.test` for the messages sent) |
| A new setting in a form section | column + migration, the section's values type / problems / changes in `src/lib/settings/form.ts`, `loadSettingsPage`, the action's zod schema and record, a control here |
| A rule (limit, range) | `src/lib/settings/form.ts` — both sides read it |
| Who may change settings | `requireOwner` in `src/auth.ts`; `canEdit` in `loadSettingsPage` |
| When Telegram counts as failing | `telegramState` in `src/lib/settings/telegram.ts` |

## Do not

- Add a chat-id text field — the code handshake is the design.
- Put Pause ordering or Auto-verify behind the Save button; they act at once.
- Delete a staff row. Removing someone is `isActive = false`, and orders keep pointing at them.
- Let a staff member's view send anything. The fieldset disables the controls, and every action calls `requireOwner` anyway.
