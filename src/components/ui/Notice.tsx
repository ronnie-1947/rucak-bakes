import type { ReactNode } from "react"

type Tone = "error" | "warm" | "success" | "quiet"

type NoticeProps = {
  /** Optional when the title alone says it ("Couldn’t reach Google…"). */
  children?: ReactNode
  /** error: something failed and needs action · warm: worth reading, nothing wrong · quiet: a muted line */
  tone?: Tone
  /** Bold first line, in the tone's colour. */
  title?: ReactNode
  className?: string
}

const tones: Record<Tone, string> = {
  error: "rounded-panel border border-red bg-red-soft px-4 py-3",
  warm: "rounded-panel bg-o50 px-3 py-2 text-small",
  success: "rounded-panel border border-green bg-green-soft px-4 py-3",
  quiet: "text-small text-muted",
}

const titles: Record<Tone, string> = {
  error: "font-semibold text-red",
  warm: "font-semibold",
  success: "font-semibold text-green",
  quiet: "font-semibold",
}

/**
 * An inline message block. The design system never uses a toast for anything the user must not
 * miss — validation errors, rejections and failures render here, in the flow of the page.
 * Errors are announced as alerts; everything else as a polite status.
 */
export function Notice({ children, tone = "error", title, className }: NoticeProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex flex-col gap-1 text-pretty ${tones[tone]} ${className ?? ""}`}>
      {title ? <span className={titles[tone]}>{title}</span> : null}
      {children ? <span>{children}</span> : null}
    </div>
  )
}
