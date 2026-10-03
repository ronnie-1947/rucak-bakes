import { Tag } from "@/components/ui/Tag"
import type { CustomerFlags as Flags } from "@/lib/customers/queries"
import type { Dict } from "@/lib/i18n"

type CustomerFlagsProps = {
  flags: Flags
  dict: Dict["admin"]["customerFlags"]
  className?: string
}

/** Trusted (green), Blocked (red), New (the warm fill) — always words, never colour alone. Renders nothing for an unflagged regular. */
export function CustomerFlags({ flags, dict, className }: CustomerFlagsProps) {
  if (!flags.isTrusted && !flags.isBlocked && !flags.isNew) return null
  return (
    <span className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {flags.isTrusted ? <Tag tone="green">{dict.trusted}</Tag> : null}
      {flags.isBlocked ? <Tag tone="red">{dict.blocked}</Tag> : null}
      {flags.isNew ? <Tag tone="accent">{dict.new}</Tag> : null}
    </span>
  )
}
