import type { ReactNode } from "react"

type ActionBarProps = {
  children: ReactNode
}

/**
 * The step's main action pinned to the bottom edge under 1024px, clear of the home indicator; from 1024px the
 * side card carries it instead. A spacer in the flow keeps the page's last lines out from under it.
 */
export function ActionBar({ children }: ActionBarProps) {
  return (
    <>
      <div aria-hidden className="h-20 shrink-0 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 pt-3 pb-safe shadow-raised md:px-6 lg:hidden print:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">{children}</div>
      </div>
    </>
  )
}
