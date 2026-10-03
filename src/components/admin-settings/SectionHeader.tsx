import { Icon } from "@/components/ui/icons/Icon"
import { GuardedLink } from "./GuardedLink"

type SectionHeaderProps = {
  title: string
  intro: string
  backHref: string
  backLabel: string
}

/** The open section's name and what it covers. Phones get a back arrow to the list — guarded like any way out. */
export function SectionHeader({ title, intro, backHref, backLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-2">
      <GuardedLink
        href={backHref}
        aria-label={backLabel}
        className="-ml-3 grid size-11 shrink-0 place-items-center rounded-button text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700 md:hidden"
      >
        <Icon name="chevronLeft" className="size-5.5" />
      </GuardedLink>
      <div className="flex min-w-0 flex-col pt-2 md:pt-0">
        <h2 className="text-h1">{title}</h2>
        <p className="text-small-admin text-pretty text-muted">{intro}</p>
      </div>
    </div>
  )
}
