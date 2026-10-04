"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { GalleryDots } from "./GalleryDots"
import { GalleryRail } from "./GalleryRail"
import { coverLoader, type Photo } from "./photos"

type ItemGalleryProps = {
  photos: Photo[]
  name: string
  /** No day in the window can take the order: 45% opacity and greyed, as on the menu cards. */
  muted: boolean
  dict: { photos: string; photo: string; showPhoto: string }
}

const looks: Record<"muted" | "plain", string> = {
  muted: "opacity-45 grayscale-40",
  plain: "",
}

/**
 * The item's photos, 4:3. A swipeable snap carousel with a dot strip below 1024px — full-bleed with only its
 * bottom corners rounded on phones; from 1024px a thumbnail rail beside it drives the carousel instead. The
 * first photo loads eagerly: it's the page's largest paint.
 */
export function ItemGallery({ photos, name, muted, dict }: ItemGalleryProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const many = photos.length > 1

  const onScroll = () => {
    const strip = scroller.current
    if (!strip) return
    const at = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))
    if (at !== index) setIndex(at)
  }

  const show = (at: number) => {
    const strip = scroller.current
    if (!strip) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    strip.scrollTo({ left: at * strip.clientWidth, behavior: still ? "auto" : "smooth" })
    setIndex(at)
  }

  return (
    <div className={`-mx-4 -mt-4 flex gap-3 md:mx-0 md:mt-0 ${looks[muted ? "muted" : "plain"]}`}>
      {many ? <GalleryRail photos={photos} index={index} onShow={show} label={dict.showPhoto} /> : null}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-b-sheet bg-sunken md:rounded-card">
        {photos.length > 0 ? (
          <div
            ref={scroller}
            onScroll={onScroll}
            role="region"
            aria-roledescription="carousel"
            aria-label={fill(dict.photos, { name })}
            tabIndex={many ? 0 : undefined}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-o700"
          >
            {photos.map((photo, at) => (
              <div
                key={photo.id}
                role="group"
                aria-roledescription="slide"
                aria-label={fill(dict.photo, { index: at + 1, count: photos.length })}
                className="relative aspect-4/3 w-full shrink-0 snap-start"
              >
                <Image
                  loader={coverLoader}
                  src={photo.id}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 45vw, 100vw"
                  loading={at === 0 ? "eager" : "lazy"}
                  fetchPriority={at === 0 ? "high" : "auto"}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid aspect-4/3 place-items-center">
            <Icon name="image" className="size-10 text-subtle" strokeWidth={1.6} />
          </div>
        )}
        {many ? <GalleryDots count={photos.length} index={index} /> : null}
      </div>
    </div>
  )
}
