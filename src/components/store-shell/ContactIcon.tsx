import { Icon, type IconName } from "@/components/ui/icons/Icon"

type ContactIconProps = {
  href: string
  icon: IconName
  /** "Call +91 94357 09287", "Instagram" — the accessible name and the hover tip, since only the glyph shows. */
  label: string
  /** A social page opens in a new tab; tel: stays. */
  external?: boolean
}

/** One borderless 44px square in the header's contact row — the glyph at the cart's size, so the bordered cart stays the lead. */
export function ContactIcon({ href, icon, label, external = false }: ContactIconProps) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-11 shrink-0 place-items-center rounded-button text-foreground hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
    >
      <Icon name={icon} className="size-5" strokeWidth={1.8} />
    </a>
  )
}
