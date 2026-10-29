import { CallLink } from "@/components/ui/CallLink"
import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import { SOCIAL_KINDS } from "@/lib/settings/social"
import type { StoreSocial } from "@/lib/storefront/types"
import { fill } from "@/lib/template"
import { SocialLink } from "./SocialLink"

type ReachUsProps = {
  /** E.164, or null — no Call button without one. */
  phone: string | null
  social: StoreSocial
  dict: Dict["landing"]["reachUs"]
}

/**
 * Right under the hero: one warm card with the Call button and the bakery's Instagram and Facebook — each only when
 * the owner has given it (Settings → Bakery details); the band disappears when none is. Tucked 16px closer to the hero
 * (24px from md) than the bands' usual gap, so it reads as the hero's foot.
 */
export function ReachUs({ phone, social, dict }: ReachUsProps) {
  const links = SOCIAL_KINDS.flatMap((kind) => {
    const href = social[kind]
    return href ? [{ kind, href }] : []
  })
  if (!phone && links.length === 0) return null
  return (
    <section
      aria-label={dict.label}
      className="-mt-4 flex flex-col gap-3 rounded-card border border-o200 bg-o50 p-4 md:-mt-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8"
    >
      <p className="font-medium text-pretty">{phone ? dict.callLine : dict.followLine}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:shrink-0 lg:flex-nowrap">
        {phone ? (
          <CallLink phone={phone} label={fill(dict.call, { phone: formatForDisplay(phone) })} variant="primary" size="lg" className="w-full sm:w-auto" />
        ) : null}
        {links.length > 0 ? (
          <div className="flex gap-3">
            {links.map((link) => (
              <SocialLink key={link.kind} kind={link.kind} href={link.href} label={dict[link.kind]} className="flex-1 sm:flex-none" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
