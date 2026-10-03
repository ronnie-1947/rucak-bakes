"use client"

import { useState, useTransition } from "react"
import { renameCustomer } from "@/app/actions/customers"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { TextInput } from "@/components/ui/TextInput"
import { CUSTOMER_LIMITS } from "@/lib/customers/limits"
import type { DetailCopy } from "./types"

type NameFieldProps = {
  customerId: string
  name: string
  dict: DetailCopy["contact"]
}

/**
 * "Name  Meera Iyer ✎" — the pencil turns it into a field with Save and Cancel. Renaming changes the record
 * only; every past order keeps the name it was placed under.
 */
export function NameField({ customerId, name, dict }: NameFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const save = () => {
    const next = draft.trim()
    if (!next || next === name) {
      setEditing(false)
      return
    }
    setFailed(false)
    startTransition(async () => {
      const result = await renameCustomer({ id: customerId, name: next })
      if (result.ok) setEditing(false)
      else setFailed(true)
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-small-admin text-muted">{dict.name}</span>
        <span className="ml-1 min-w-0 truncate font-medium">{name}</span>
        <button
          type="button"
          aria-label={dict.editName}
          onClick={() => {
            setDraft(name)
            setEditing(true)
          }}
          className="grid size-11 shrink-0 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <Icon name="pencil" className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <TextInput
          aria-label={dict.name}
          value={draft}
          maxLength={CUSTOMER_LIMITS.name}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save()
            if (event.key === "Escape") setEditing(false)
          }}
          aria-describedby="name-hint"
        />
        <Button variant="outline" disabled={pending} onClick={save}>
          {dict.save}
        </Button>
      </div>
      <span id="name-hint" className="text-small-admin text-muted">
        {failed ? <span className="text-red">{dict.nameFailed}</span> : dict.nameHint}
      </span>
      <Button variant="link" size="inline" className="self-start" onClick={() => setEditing(false)}>
        {dict.cancel}
      </Button>
    </div>
  )
}
