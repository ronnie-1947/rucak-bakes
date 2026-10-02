import { Notice } from "@/components/ui/Notice"
import { Rich } from "@/components/ui/Rich"
import type { LoginCopy, LoginState } from "./types"

type LoginStatusProps = {
  state: LoginState
  dict: LoginCopy
  /** The Google account that was refused — named, because a personal account is the usual cause. */
  email: string | null
  /** Where an expired session will return to, already translated ("Day sheet"). */
  destination: string
}

/**
 * One block per state. A refusal and a failure are red blocks; a cancel is a muted line (nothing went
 * wrong); an expired session is a warm line. Never "access denied", "unauthorised" or a status code.
 */
export function LoginStatus({ state, dict, email, destination }: LoginStatusProps) {
  switch (state) {
    case "rejected":
      return (
        <Notice tone="error" title={dict.rejected.title}>
          <Rich template={dict.rejected.body} values={{ email: <strong className="font-semibold wrap-anywhere">{email ?? dict.rejected.unknownEmail}</strong> }} />
        </Notice>
      )
    case "network":
      return <Notice tone="error" title={dict.network} />
    case "failed":
      return <Notice tone="error" title={dict.failed} />
    case "cancelled":
      return <Notice tone="quiet">{dict.cancelled}</Notice>
    case "expired":
      return (
        <Notice tone="warm">
          <Rich template={dict.expired} values={{ destination: <strong className="font-semibold">{destination}</strong> }} />
        </Notice>
      )
    case "ready":
      return null
  }
}
