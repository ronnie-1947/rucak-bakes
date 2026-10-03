import { Button } from "@/components/ui/Button"
import type { StaffMember } from "@/lib/settings/queries"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type StaffRowProps = {
  person: StaffMember
  /** An owner viewing — Remove shows where it's allowed. */
  canEdit: boolean
  onRemove: () => void
  dict: SettingsCopy["staff"]
}

/** One person who can sign in: name (and "You"), their Google address, role and last sign-in, Remove. */
export function StaffRow({ person, canEdit, onRemove, dict }: StaffRowProps) {
  const seen = person.lastSignIn ? fill(dict.lastSignIn, { date: person.lastSignIn }) : dict.neverSignedIn
  return (
    <li className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border px-3 py-2 first:border-t-0">
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="min-w-0 wrap-break-word">{person.name}</span>
          {person.isYou ? <span className="rounded-pill border border-o200 bg-o50 px-2 text-micro font-semibold text-o700">{dict.you}</span> : null}
        </span>
        <span className="text-small-admin break-all text-muted">{person.email}</span>
        <span className="text-small-admin text-muted tabular-nums">
          {dict.roles[person.role]} · {seen}
        </span>
      </span>
      {canEdit && person.canRemove ? (
        <Button variant="dangerOutline" size="sm" onClick={onRemove} aria-label={fill(dict.removeLabel, { name: person.name })}>
          {dict.remove}
        </Button>
      ) : null}
    </li>
  )
}
