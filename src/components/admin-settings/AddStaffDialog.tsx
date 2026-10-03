"use client"

import { type FormEvent, useState, useTransition } from "react"
import { addStaffMember } from "@/app/actions/settings"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Field } from "@/components/ui/Field"
import { TextInput } from "@/components/ui/TextInput"
import type { StaffRole } from "@/generated/prisma/client"
import { SETTINGS_LIMITS } from "@/lib/settings/form"
import { fill } from "@/lib/template"
import { RoleChoice } from "./RoleChoice"
import type { SettingsCopy } from "./types"

type AddStaffDialogProps = {
  dict: SettingsCopy["staff"]
  onClose: () => void
  /** The name as given, and whether they had access before. */
  onAdded: (name: string, restored: boolean) => void
}

const EMAIL = /^\S+@\S+\.\S+$/

/**
 * Puts someone's Google address on the sign-in list. No invite is sent — Google is the only way in, so
 * the dialog says to tell them. Field errors show after the first try; "already has access" comes back
 * from the server under the address.
 */
export function AddStaffDialog({ dict, onClose, onAdded }: AddStaffDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StaffRole>("STAFF")
  const [tried, setTried] = useState(false)
  const [problem, setProblem] = useState<"exists" | "failed" | null>(null)
  const [pending, startTransition] = useTransition()

  const nameError = tried && !name.trim() ? dict.nameRequired : undefined
  const emailInvalid = tried && !EMAIL.test(email.trim()) ? dict.emailInvalid : undefined
  const emailError = problem === "exists" ? fill(dict.exists, { email: email.trim().toLowerCase() }) : emailInvalid

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    setProblem(null)
    if (!name.trim() || !EMAIL.test(email.trim())) return
    startTransition(async () => {
      const result = await addStaffMember({ name, email, role }).catch(() => null)
      if (result?.ok) onAdded(name.trim(), result.restored)
      else setProblem(result?.reason === "EXISTS" ? "exists" : "failed")
    })
  }

  return (
    <Dialog open onClose={onClose} title={dict.addTitle} closeLabel={dict.close}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field id="staff-name" label={dict.name} error={nameError}>
          <TextInput
            id="staff-name"
            value={name}
            maxLength={SETTINGS_LIMITS.staffName}
            autoComplete="off"
            invalid={Boolean(nameError)}
            aria-describedby="staff-name-message"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id="staff-email" label={dict.email} hint={dict.emailHint} error={emailError}>
          <TextInput
            id="staff-email"
            type="email"
            value={email}
            autoComplete="off"
            inputMode="email"
            invalid={Boolean(emailError)}
            aria-describedby="staff-email-message"
            onChange={(event) => {
              setEmail(event.target.value)
              if (problem === "exists") setProblem(null)
            }}
          />
        </Field>
        <RoleChoice value={role} onChange={setRole} dict={dict} />
        {problem === "failed" ? (
          <p role="alert" className="text-small-admin text-red">
            {dict.failed}
          </p>
        ) : null}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            {dict.cancel}
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? dict.adding : dict.addOk}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
