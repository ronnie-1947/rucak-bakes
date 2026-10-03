import Image from "next/image"
import { imageUrl } from "@/lib/cloudinary"
import type { IsoDate } from "@/lib/dates"
import type { OpeningHours } from "@/lib/settings/hours"
import { type Banner, todayHoursText } from "./copy"
import type { SettingsCopy } from "./types"

type LandingPreviewProps = {
  name: string
  tagline: string
  /** "+91 98450 55012", or "" when hidden. */
  phone: string
  address: string
  /** Null until the hours are first saved — the line leaves them out, as the landing page will. */
  hours: OpeningHours | null
  heroImage: string | null
  /** Pause beats the announcement: only one strip shows. */
  banner: Banner | null
  today: IsoDate
  dict: SettingsCopy
}

const banners: Record<Banner["tone"], string> = {
  paused: "bg-red-soft text-red",
  note: "bg-o50 text-foreground",
}

/** The top of the customer's landing page as it stands with these settings — a customer card, so 16px corners. */
export function LandingPreview({ name, tagline, phone, address, hours, heroImage, banner, today, dict }: LandingPreviewProps) {
  const contact = [phone, address.split("\n")[0], hours ? todayHoursText(hours, today, dict.preview) : ""].filter(Boolean).join(" · ")
  return (
    <div className="overflow-hidden rounded-card border border-border bg-background">
      {banner ? <p className={`px-3 py-2 text-small-admin font-semibold text-pretty ${banners[banner.tone]}`}>{banner.text}</p> : null}
      <p className="border-b border-border px-4 py-3 font-display text-h2 font-semibold wrap-break-word">{name || dict.bakery.previewName}</p>
      <div className="flex flex-col gap-2 p-3">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-panel bg-sunken">
          {heroImage ? (
            <Image src={imageUrl(heroImage, { w: 960, ar: "16:9" })} alt="" width={480} height={270} unoptimized className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="text-small-admin text-subtle">{dict.preview.heroEmpty}</span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-o500 p-3 font-display text-h2 font-semibold text-pretty text-foreground">
            {tagline || dict.bakery.previewTagline}
          </span>
        </div>
        {contact ? <p className="text-small-admin text-pretty text-muted tabular-nums">{contact}</p> : null}
      </div>
    </div>
  )
}
