"use client"

import { useState, useTransition } from "react"
import { removeStaffMember } from "@/app/actions/settings"
import { Button } from "@/components/ui/Button"
import { Notice } from "@/components/ui/Notice"
import type { SettingsPageData, StaffMember } from "@/lib/settings/queries"
import { fill } from "@/lib/template"
import { AddStaffDialog } from "./AddStaffDialog"
import { fullRow } from "./layout"
import { PaneGrid } from "./PaneGrid"
import { RemoveStaffDialog } from "./RemoveStaffDialog"
import { RolesPreview } from "./RolesPreview"
import { StaffRow } from "./StaffRow"
import type { SettingsCopy } from "./types"

type StaffSectionProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

type Outcome = { tone: "success" | "error"; text: string } | null

/**
 * Who can sign in. Owners add a Google address (with a role) or remove someone after a confirm — never
 * themselves, never the last owner. Each change saves at once and the list refreshes from the server.
 */
export function StaffSection({ data, dict }: StaffSectionProps) {
  const d = dict.staff
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<StaffMember | null>(null)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [pending, startTransition] = useTransition()

  const remove = (person: StaffMember) =>
    startTransition(async () => {
      const result = await removeStaffMember({ id: person.id }).catch(() => null)
      setRemoving(null)
      if (result?.ok) setOutcome({ tone: "success", text: fill(d.removed, { name: person.name }) })
      else setOutcome({ tone: "error", text: result?.reason === "LAST_OWNER" ? d.lastOwner : d.failed })
    })

  return (
    <PaneGrid canEdit={data.canEdit} where="roles" dict={dict.preview} preview={<RolesPreview dict={dict.preview} />}>
      <div className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
        <span id="staff-label" className="text-small-admin text-muted">
          {d.label}
        </span>
        <ul aria-labelledby="staff-label" className="flex flex-col rounded-panel border border-border">
          {data.staff.map((person) => (
            <StaffRow
              key={person.id}
              person={person}
              canEdit={data.canEdit}
              onRemove={() => {
                setOutcome(null)
                setRemoving(person)
              }}
              dict={d}
            />
          ))}
        </ul>
        <span className="text-small-admin text-pretty text-muted">{d.hint}</span>
      </div>
      {outcome ? (
        <Notice tone={outcome.tone} className={fullRow}>
          {outcome.text}
        </Notice>
      ) : null}
      {data.canEdit ? (
        <Button
          variant="primary"
          className={`self-start justify-self-start ${fullRow}`}
          onClick={() => {
            setOutcome(null)
            setAdding(true)
          }}
        >
          {d.add}
        </Button>
      ) : null}

      {adding ? (
        <AddStaffDialog
          dict={d}
          onClose={() => setAdding(false)}
          onAdded={(name, restored) => {
            setAdding(false)
            setOutcome({ tone: "success", text: fill(restored ? d.restored : d.added, { name }) })
          }}
        />
      ) : null}
      {removing ? (
        <RemoveStaffDialog name={removing.name} pending={pending} dict={d} onClose={() => setRemoving(null)} onConfirm={() => remove(removing)} />
      ) : null}
    </PaneGrid>
  )
}
