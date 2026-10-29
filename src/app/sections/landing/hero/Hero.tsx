import { CallLink } from "@/components/ui/CallLink"
import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import type { LandingData } from "@/lib/storefront/landing"
import { fill } from "@/lib/template"
import { HeroPhoto } from "./HeroPhoto"

type HeroProps = {
  hero: LandingData["hero"]
  /** E.164, or null — no Call button without one. */
  phone: string | null
  dict: Dict["landing"]["hero"]
}

/**
 * The owner's photo (Settings → Appearance) with the tagline on a warm o500 band — ink text, never white on o500.
 * Below md the band sits under a 4:3 (16:9 from sm) photo frame, so the whole width of a landscape photo shows;
 * from md the band lies across the photo's foot. Without a photo the sunken placeholder holds the frame. Under it, a
 * small Call button on its own (the header has a Call square too) — only with a public phone.
 */
export function Hero({ hero, phone, dict }: HeroProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <section className="relative isolate flex flex-col self-stretch overflow-hidden rounded-sheet bg-sunken md:block md:aspect-21/9 lg:aspect-21/8">
        <div className="relative aspect-4/3 sm:aspect-video md:absolute md:inset-0 md:aspect-auto">
          {hero.image ? <HeroPhoto image={hero.image} /> : null}
        </div>
        <div className="flex flex-col gap-1 bg-o500 px-4 py-3 text-foreground md:absolute md:inset-x-0 md:bottom-0 lg:px-8 lg:py-4">
          <h1 className="text-glance text-balance lg:text-glance-lg">{hero.tagline ?? dict.fallback}</h1>
          <p className="text-pretty">{dict.sub}</p>
        </div>
      </section>
      {phone ? <CallLink phone={phone} label={fill(dict.call, { phone: formatForDisplay(phone) })} variant="primary" size="sm" /> : null}
    </div>
  )
}
