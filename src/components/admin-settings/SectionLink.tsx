import { Icon, type IconName } from "@/components/ui/icons/Icon"
import type { Summary } from "./copy"
import { DirtyDot } from "./DirtyDot"
import { GuardedLink } from "./GuardedLink"

type SectionLinkProps = {
  href: string
  title: string
  summary: Summary
  icon: IconName
  /** The section the pane shows — highlighted from 768px, where the list sits beside it. */
  current: boolean
  dirtyLabel: string
}

type State = "current" | "other"

/** Phones: a 64px card with the saved state under the name. From 768px: a 48px row, the open one marked. */
const frames: Record<State, string> = {
  current: "md:border-o200 md:bg-o50",
  other: "md:border-transparent",
}

const icons: Record<State, string> = {
  current: "md:text-o700",
  other: "",
}

const markers: Record<State, string> = {
  current: "md:block",
  other: "",
}

const summaries: Record<"alert" | "quiet", string> = {
  alert: "text-red",
  quiet: "text-muted",
}

/** One entry in the section list. */
export function SectionLink({ href, title, summary, icon, current, dirtyLabel }: SectionLinkProps) {
  const state: State = current ? "current" : "other"
  return (
    <GuardedLink
      href={href}
      current={current}
      className={`relative grid min-h-16 grid-cols-[1.5rem_minmax(0,1fr)_1.125rem] items-center gap-3 rounded-panel border border-border bg-background px-3 py-2 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 md:min-h-12 md:grid-cols-[1.5rem_minmax(0,1fr)] ${frames[state]}`}
    >
      <span aria-hidden className={`absolute top-3 bottom-3 -left-px hidden w-1 rounded-pill bg-o500 ${markers[state]}`} />
      <Icon name={icon} className={`size-5.5 text-muted ${icons[state]}`} />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 font-semibold">
          {title}
          {current ? <DirtyDot label={dirtyLabel} /> : null}
        </span>
        <span className={`text-small-admin text-pretty tabular-nums md:hidden ${summaries[summary.alert ? "alert" : "quiet"]}`}>{summary.text}</span>
      </span>
      <Icon name="chevronRight" className="size-4.5 text-muted md:hidden" />
    </GuardedLink>
  )
}
