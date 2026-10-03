import type { StaffRole } from "@/generated/prisma/client"
import type { SettingsCopy } from "./types"

type RoleChoiceProps = {
  value: StaffRole
  onChange: (role: StaffRole) => void
  dict: SettingsCopy["staff"]
}

const ROLES: StaffRole[] = ["STAFF", "OWNER"]

/** Staff or Owner as two cards, each saying what it can do. Native radios underneath — arrow keys work. */
export function RoleChoice({ value, onChange, dict }: RoleChoiceProps) {
  const hints: Record<StaffRole, string> = { STAFF: dict.roleStaffHint, OWNER: dict.roleOwnerHint }
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-small-admin text-muted">{dict.role}</legend>
      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
        {ROLES.map((role) => (
          <label
            key={role}
            className="flex min-h-16 cursor-pointer flex-col rounded-panel border border-border bg-background px-3 py-2 has-checked:border-o500 has-checked:bg-o50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-o700"
          >
            <input type="radio" name="staff-role" value={role} checked={value === role} onChange={() => onChange(role)} className="sr-only" />
            <span className="font-semibold">{dict.roles[role]}</span>
            <span className="text-small-admin text-pretty text-muted">{hints[role]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
