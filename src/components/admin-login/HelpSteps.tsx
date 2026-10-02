import { Rich } from "@/components/ui/Rich"
import type { LoginCopy, OwnerPhone } from "./types"

type HelpStepsProps = {
  dict: LoginCopy["help"]
  /** Adds the "call the owner" step when settings has a public phone. */
  ownerPhone: OwnerPhone
}

export function HelpSteps({ dict, ownerPhone }: HelpStepsProps) {
  const steps = ownerPhone
    ? [
        ...dict.steps,
        <Rich
          key="call"
          template={dict.call}
          values={{
            phone: (
              <a href={`tel:${ownerPhone.e164}`} className="font-semibold whitespace-nowrap text-o700 hover:underline">
                {ownerPhone.display}
              </a>
            ),
          }}
        />,
      ]
    : dict.steps

  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span aria-hidden className="w-6 shrink-0 font-semibold text-muted">
            {index + 1}
          </span>
          <span className="text-pretty">{step}</span>
        </li>
      ))}
    </ol>
  )
}
