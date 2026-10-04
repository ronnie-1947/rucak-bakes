import { Container } from "@/components/ui/Container"
import type { StoreBanner } from "@/lib/storefront/types"
import { fill } from "@/lib/template"
import type { StoreCopy } from "./copy"

type StoreBannerStripProps = {
  banner: StoreBanner
  dict: StoreCopy["shell"]
}

const tones: Record<StoreBanner["kind"], string> = {
  paused: "bg-red-soft text-red",
  note: "bg-o50 text-foreground",
}

/** The line above the header: the owner's pause reason (red) or their announcement (warm). Scrolls away with the page. */
export function StoreBannerStrip({ banner, dict }: StoreBannerStripProps) {
  const text = banner.kind === "note" ? banner.text : banner.reason ? fill(dict.paused, { reason: banner.reason }) : dict.pausedNoReason
  return (
    <div role={banner.kind === "paused" ? "alert" : "status"} className={`print:hidden ${tones[banner.kind]}`}>
      <Container className="py-2 text-small font-semibold text-pretty">{text}</Container>
    </div>
  )
}
