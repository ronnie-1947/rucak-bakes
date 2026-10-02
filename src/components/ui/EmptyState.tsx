import type { ReactNode } from "react"

type EmptyStateProps = {
  message: ReactNode
  /** One way forward — a ButtonLink or Button. */
  action?: ReactNode
  className?: string
}

/** Sunken box, centred line, at most one action. An empty result is an answer, not an error. */
export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-4 rounded-panel bg-sunken px-6 py-12 text-center ${className ?? ""}`}>
      <p className="text-muted">{message}</p>
      {action}
    </div>
  )
}
