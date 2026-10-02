import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"
import type { LoginCopy, LoginState } from "./types"

type LoginActionsProps = {
  state: LoginState
  dict: LoginCopy
  /** The sign-in action is in flight — the redirect to Google is on its way. */
  pending: boolean
}

/**
 * Exactly one submit button. A refusal swaps Google's button for "Try a different account" (which sends
 * `chooser=1` → Google's account picker); a failure swaps it for "Try again".
 */
export function LoginActions({ state, dict, pending }: LoginActionsProps) {
  const opening = (
    <>
      <Spinner />
      <span className="text-muted">{dict.opening}</span>
    </>
  )

  if (state === "rejected") {
    return (
      <Button type="submit" name="chooser" value="1" variant="outlineAccent" size="lg" disabled={pending} className="w-full">
        {pending ? opening : dict.tryDifferent}
      </Button>
    )
  }

  if (state === "network" || state === "failed") {
    return (
      <Button type="submit" variant="outlineAccent" size="lg" disabled={pending} className="w-full">
        {pending ? opening : dict.retry}
      </Button>
    )
  }

  return (
    <Button type="submit" variant="outline" size="lg" disabled={pending} autoFocus={state === "ready"} className="w-full gap-3">
      {pending ? (
        opening
      ) : (
        <>
          <Image src="/google-g.svg" alt="" width={20} height={20} />
          <span>{dict.google}</span>
        </>
      )}
    </Button>
  )
}
