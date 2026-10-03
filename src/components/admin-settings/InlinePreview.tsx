import type { ReactNode } from "react"

type InlinePreviewProps = {
  label: string
  children: ReactNode
  className?: string
}

/** A small sunken "Preview" box under the fields it shows. Below 1280px only — from there the preview column takes over. */
export function InlinePreview({ label, children, className }: InlinePreviewProps) {
  return (
    <div className={`flex flex-col gap-2 rounded-panel border border-border bg-sunken p-3 xl:hidden ${className ?? ""}`}>
      <span className="text-micro font-semibold text-muted uppercase">{label}</span>
      {children}
    </div>
  )
}
