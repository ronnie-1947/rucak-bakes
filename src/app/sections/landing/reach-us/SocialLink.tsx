import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { SocialKind } from "@/lib/settings/social"

type SocialLinkProps = {
  kind: SocialKind
  href: string
  /** "Instagram" — the glyph alone would say too little to a screen reader. */
  label: string
  className?: string
}

/** The bakery's page on Instagram or Facebook, drawn as the outline button that sits beside a primary action. Opens in a new tab. */
export function SocialLink({ kind, href, label, className }: SocialLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses("outlineLink", "lg", `px-4 sm:px-6 ${className ?? ""}`)}>
      <Icon name={kind} className="size-5 shrink-0" />
      {label}
    </a>
  )
}
