import type { IconName } from "@/components/ui/icons/Icon"
import type { Dict } from "@/lib/i18n"
import { HowStep } from "./HowStep"

type HowItWorksProps = {
  dict: Dict["landing"]["howItWorks"]
}

/** Glyphs for the dict's three steps, in order: pick, send, we call. */
const ICONS: readonly IconName[] = ["check", "send", "phone"]

/** Three steps on a sunken panel — the promise that replaces checkout: no account, no payment, a call to confirm. */
export function HowItWorks({ dict }: HowItWorksProps) {
  return (
    <section aria-labelledby="how-it-works" className="flex flex-col gap-4 rounded-card bg-sunken px-4 py-6 lg:p-8">
      <h2 id="how-it-works" className="text-h2">
        {dict.title}
      </h2>
      <ol className="grid gap-4 lg:grid-cols-3 lg:gap-8">
        {dict.steps.map((step, index) => (
          <HowStep key={step.title} icon={ICONS[index] ?? "check"} title={step.title} text={step.text} />
        ))}
      </ol>
    </section>
  )
}
