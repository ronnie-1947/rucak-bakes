import { SOCIAL_KINDS } from "@/lib/settings/social"
import type { StoreSocial } from "@/lib/storefront/types"
import type { HeaderCall } from "./call"
import { ContactIcon } from "./ContactIcon"
import type { StoreCopy } from "./copy"

type ContactLinksProps = {
  /** Null — no Call. */
  call: HeaderCall | null
  social: StoreSocial
  dict: StoreCopy["shell"]
  className?: string
}

/** Call, Instagram, Facebook — left of the cart, each only when the owner has given it (Settings → Bakery details). */
export function ContactLinks({ call, social, dict, className }: ContactLinksProps) {
  const links = SOCIAL_KINDS.flatMap((kind) => {
    const href = social[kind]
    return href ? [{ kind, href }] : []
  })
  if (!call && links.length === 0) return null
  return (
    <div className={`flex shrink-0 items-center ${className ?? ""}`}>
      {call ? <ContactIcon href={`tel:${call.phone}`} icon="phone" label={call.label} /> : null}
      {links.map((link) => (
        <ContactIcon key={link.kind} href={link.href} icon={link.kind} label={dict[link.kind]} external />
      ))}
    </div>
  )
}
