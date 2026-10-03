import { buttonClasses } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { fill } from "@/lib/template"
import { NameField } from "./NameField"
import type { DetailCopy } from "./types"

type ContactCardProps = {
  customer: CustomerDetailData
  dict: DetailCopy["contact"]
}

/**
 * Within the first screen on a phone: the number, large and tappable, Call and WhatsApp, the name (editable),
 * their delivery address when they've had one, and how long they've been a customer.
 */
export function ContactCard({ customer, dict }: ContactCardProps) {
  const whatsapp = `https://wa.me/${customer.phoneE164.replace(/\D/g, "")}`
  const maps = customer.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}` : null

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-border p-3">
      <a href={`tel:${customer.phoneE164}`} className="flex min-h-11 items-center gap-2 self-start text-h1 font-semibold text-o700 tabular-nums hover:underline">
        <Icon name="phone" className="size-5.5" />
        {customer.phoneDisplay}
      </a>
      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${customer.phoneE164}`} className={buttonClasses("primary", "md", "font-semibold")}>
          {dict.call}
        </a>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClasses("outlineLink", "md")}>
          {dict.whatsapp}
        </a>
      </div>
      <NameField key={customer.name} customerId={customer.id} name={customer.name} dict={dict} />
      {customer.address && maps ? (
        <div className="flex flex-col">
          <span className="break-words">{customer.address}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-small-admin text-muted">
            <a href={maps} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-1 font-semibold text-o700 hover:underline">
              <Icon name="map" className="size-4" />
              {dict.maps}
            </a>
            {dict.addressFrom}
          </span>
        </div>
      ) : null}
      <span className="text-small-admin text-muted tabular-nums">{fill(dict.since, { date: customer.sinceLabel })}</span>
    </section>
  )
}
