import { Icon } from "@/components/ui/icons/Icon"

type ExpectationProps = {
  /** "We’ll call you within 2 hours to confirm." */
  strong: string
  /** "Your order isn’t final until then." */
  rest: string
}

/**
 * The line that replaces checkout's usual certainty (runbook 6.3): the order is a request until the bakery
 * calls. It sits right above Place order, where it's read.
 */
export function Expectation({ strong, rest }: ExpectationProps) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-border-strong p-4">
      <Icon name="phone" className="size-5 shrink-0 text-o700" />
      <p className="text-pretty">
        <strong className="font-semibold">{strong}</strong> {rest}
      </p>
    </div>
  )
}
