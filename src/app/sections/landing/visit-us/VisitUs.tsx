import type { Dict } from "@/lib/i18n"
import { formatForDisplay } from "@/lib/phone"
import type { LandingData } from "@/lib/storefront/landing"
import { hoursLines, mapHref } from "./copy"
import { VisitRow } from "./VisitRow"

type VisitUsProps = {
  visit: LandingData["visit"]
  dict: Dict["landing"]["visitUs"]
}

const link = "font-semibold text-o700 hover:underline focus-visible:outline-2 focus-visible:outline-o700"

/**
 * Address (with a Maps link), opening hours folded into runs, and a tap-to-call number — each row only when the
 * owner has filled it in (Settings → Bakery details); the band disappears when none is.
 */
export function VisitUs({ visit, dict }: VisitUsProps) {
  const { address, phone, hours } = visit
  if (address.length === 0 && !phone && !hours) return null
  return (
    <section aria-labelledby="visit-us" className="flex max-w-xl flex-col gap-3">
      <h2 id="visit-us" className="text-h2">
        {dict.title}
      </h2>
      <dl className="flex flex-col gap-2">
        {address.length > 0 ? (
          <VisitRow label={dict.address}>
            {address.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <a href={mapHref(address)} target="_blank" rel="noopener noreferrer" aria-label={dict.mapLabel} className={`inline-flex min-h-11 items-center ${link}`}>
              {dict.map}
            </a>
          </VisitRow>
        ) : null}
        {hours ? (
          <VisitRow label={dict.hours}>
            {hoursLines(hours, dict).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </VisitRow>
        ) : null}
        {phone ? (
          <VisitRow label={dict.phone}>
            <a href={`tel:${phone}`} className={`inline-flex min-h-11 items-center ${link}`}>
              {formatForDisplay(phone)}
            </a>
          </VisitRow>
        ) : null}
      </dl>
    </section>
  )
}
