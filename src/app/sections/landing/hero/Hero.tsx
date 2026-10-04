import Image from "next/image"
import { imageUrl } from "@/lib/cloudinary"
import type { Dict } from "@/lib/i18n"
import type { LandingData } from "@/lib/storefront/landing"

type HeroProps = {
  hero: LandingData["hero"]
  dict: Dict["landing"]["hero"]
}

/**
 * The owner's photo (Settings → Appearance) with the tagline on a warm o500 band across its foot — ink text,
 * never white on o500. Without a photo the sunken placeholder shows above the band.
 */
export function Hero({ hero, dict }: HeroProps) {
  return (
    <section className="relative isolate min-h-90 overflow-hidden rounded-sheet bg-sunken md:aspect-21/9 md:min-h-0 lg:aspect-21/8">
      {hero.image ? (
        <Image
          // Uncropped: the frame is near-square on a phone and 21:9 on a laptop, so object-cover does the crop.
          src={imageUrl(hero.image, { w: 2560 })}
          alt=""
          fill
          priority
          unoptimized
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="-z-10 object-cover"
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-o500 p-4 text-foreground lg:px-8 lg:py-6">
        <h1 className="text-glance text-balance lg:text-glance-lg">{hero.tagline ?? dict.fallback}</h1>
        <p className="text-pretty">{dict.sub}</p>
      </div>
    </section>
  )
}
