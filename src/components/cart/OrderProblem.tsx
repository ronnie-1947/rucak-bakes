import { Button, buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { formatForDisplay } from "@/lib/phone"
import { fill } from "@/lib/template"
import type { CartPageCopy } from "./copy"
import { ProblemAlert } from "./ProblemAlert"

/** Why Place order didn't go through, when it isn't the day itself (the day card and its alert say that). */
export type Problem =
  | { kind: "item"; menuItemId: string; name: string | null; remaining: number }
  | { kind: "fulfilment" }
  | { kind: "rateLimited" }
  | { kind: "invalid" }
  | { kind: "network" }

type OrderProblemProps = {
  problem: Problem
  /** The bakery's E.164 number — offered when calling is the way out. */
  phone: string | null
  /** Lower the item to what's left, or take it out. */
  onFixItem: () => void
  copy: CartPageCopy
}

/** dev-docs/implementation.md 7.2 — each refusal named in the customer's words, with its one way forward. */
export function OrderProblem({ problem, phone, onFixItem, copy }: OrderProblemProps) {
  const p = copy.cart.problems
  const call = phone ? (
    <a href={`tel:${phone}`} className={buttonClasses("outlineLink", "lg", "w-full")}>
      <Icon name="phone" className="size-4.5" />
      {fill(p.call, { phone: formatForDisplay(phone) })}
    </a>
  ) : null

  switch (problem.kind) {
    case "item": {
      const name = problem.name ?? p.itemUnknown
      const title = problem.remaining > 0 ? fill(p.itemFew, { count: problem.remaining, name }) : fill(p.itemGone, { name })
      return (
        <ProblemAlert
          title={title}
          body={`${p.itemBody} ${p.kept}`}
          action={
            <Button variant="outlineAccent" size="lg" className="w-full" onClick={onFixItem}>
              {problem.remaining > 0 ? fill(p.itemLower, { count: problem.remaining }) : p.itemRemove}
            </Button>
          }
        />
      )
    }
    case "fulfilment":
      return <ProblemAlert title={p.fulfilment} body={p.fulfilmentBody} action={call} />
    case "rateLimited":
      return <ProblemAlert title={p.rateLimited} body={phone ? p.rateLimitedBody : p.rateLimitedLater} action={call} />
    case "invalid":
      return <ProblemAlert title={p.invalid} body={p.invalidBody} />
    case "network":
      return <ProblemAlert title={p.network} body={p.networkBody} />
  }
}
