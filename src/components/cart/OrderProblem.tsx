import { Button, buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { formatLongDayLabel, type IsoDate } from "@/lib/dates"
import { formatForDisplay } from "@/lib/phone"
import { noticeLength } from "@/lib/storefront/words"
import { fill } from "@/lib/template"
import { type CartPageCopy, capitalise, dayName } from "./copy"
import { ProblemAlert } from "./ProblemAlert"

/** Why Place order didn't go through, when it isn't the day itself (the day card and its alert say that). */
export type Problem =
  /** It can't be ordered online any more — already taken out of the cart. */
  | { kind: "item"; name: string | null }
  /** The longest-notice line, and the first date that takes every line. */
  | { kind: "tooSoon"; date: IsoDate; name: string | null; notice: number; earliest: IsoDate | null }
  | { kind: "fulfilment" }
  | { kind: "rateLimited" }
  | { kind: "invalid" }
  | { kind: "network" }

type OrderProblemProps = {
  problem: Problem
  /** The bakery's E.164 number — offered when calling is the way out. */
  phone: string | null
  today: IsoDate
  /** Move the cart to that date (too soon). */
  onMove: (date: IsoDate) => void
  /** No date takes every line: open Change day. */
  onChooseDay: () => void
  copy: CartPageCopy
}

/** dev-docs/implementation.md 7.2 — each refusal named in the customer's words, with its one way forward. */
export function OrderProblem({ problem, phone, today, onMove, onChooseDay, copy }: OrderProblemProps) {
  const p = copy.cart.problems
  const call = phone ? (
    <a href={`tel:${phone}`} className={buttonClasses("outlineLink", "lg", "w-full")}>
      <Icon name="phone" className="size-4.5" />
      {fill(p.call, { phone: formatForDisplay(phone) })}
    </a>
  ) : null

  switch (problem.kind) {
    case "item":
      return <ProblemAlert title={fill(p.itemGone, { name: problem.name ?? p.itemUnknown })} body={`${p.itemBody} ${p.kept}`} />
    case "tooSoon": {
      const name = problem.name ?? p.itemUnknown
      const notice = noticeLength(problem.notice, copy.notice)
      const { earliest } = problem
      return (
        <ProblemAlert
          title={fill(p.tooSoon, { day: capitalise(dayName(problem.date, today, copy)) })}
          body={
            earliest
              ? fill(p.tooSoonBody, { name, notice, date: formatLongDayLabel(earliest) })
              : fill(p.tooSoonNone, { name: capitalise(name), notice })
          }
          action={
            <Button size="lg" className="w-full font-semibold" onClick={() => (earliest ? onMove(earliest) : onChooseDay())}>
              {earliest ? fill(copy.cart.move, { day: dayName(earliest, today, copy) }) : copy.cart.chooseDay}
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
