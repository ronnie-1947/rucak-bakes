"use client"

import { unstable_rethrow } from "next/navigation"
import { useActionState } from "react"
import { signInWithGoogle } from "@/app/actions/auth"
import { Checkbox } from "@/components/ui/Checkbox"
import { LoginActions } from "./LoginActions"
import { LoginStatus } from "./LoginStatus"
import { TroubleSignIn } from "./TroubleSignIn"
import type { LoginCopy, LoginState, OwnerPhone } from "./types"

type LoginFormProps = {
  dict: LoginCopy
  /** The state the URL put us in. A failed submit overrides it with `network`. */
  state: LoginState
  email: string | null
  destination: string
  /** Already sanitised to a path under /admin. */
  callbackUrl: string
  ownerPhone: OwnerPhone
}

type Failure = "network" | null

/** On success the action redirects away to Google and never returns; a throw means it never reached us. */
async function submit(_previous: Failure, formData: FormData): Promise<Failure> {
  try {
    await signInWithGoogle(formData)
    return null
  } catch (error) {
    unstable_rethrow(error)
    return "network"
  }
}

export function LoginForm({ dict, state, email, destination, callbackUrl, ownerPhone }: LoginFormProps) {
  const [failure, action, pending] = useActionState(submit, null)
  const shown = failure ?? state

  return (
    <form action={action} aria-busy={pending} className="mt-4 flex flex-col">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-3">
        <LoginStatus state={shown} dict={dict} email={email} destination={destination} />
        <LoginActions state={shown} dict={dict} pending={pending} />
      </div>

      <p className="mt-6 text-small text-muted">{dict.approvedOnly}</p>

      {/* Dimmed and inert while Google opens. The kitchen tablet (md→lg) gets the box, to draw the eye to "keep". */}
      <div inert={pending} className="mt-4 flex flex-col inert:opacity-45 md:max-lg:rounded-panel md:max-lg:border md:max-lg:border-border md:max-lg:bg-sunken md:max-lg:px-3">
        <Checkbox name="keep" defaultChecked label={dict.keep.label} hint={dict.keep.hint} />
      </div>
      <div inert={pending} className="flex flex-col inert:opacity-45">
        <TroubleSignIn dict={dict.help} ownerPhone={ownerPhone} />
      </div>
    </form>
  )
}
