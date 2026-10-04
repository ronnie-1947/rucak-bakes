"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import { fill } from "@/lib/template"
import { type Photo, thumbLoader } from "./photos"

type GalleryRailProps = {
  photos: Photo[]
  index: number
  onShow: (index: number) => void
  /** "Show photo {index} of {count}" */
  label: string
}

const frames: Record<"current" | "other", string> = {
  current: "border-o500",
  other: "border-border",
}

/**
 * From 1024px: square thumbnails in a column as tall as the photo, scrolling on its own when there are more
 * than fit. The current one has the warm border and is kept in view.
 */
export function GalleryRail({ photos, index, onShow, label }: GalleryRailProps) {
  const rail = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const column = rail.current
    const thumb = column?.children[index] as HTMLElement | undefined
    if (!column || !thumb) return
    // The rail only — scrollIntoView would move the page too.
    if (thumb.offsetTop < column.scrollTop) column.scrollTo({ top: thumb.offsetTop })
    else if (thumb.offsetTop + thumb.offsetHeight > column.scrollTop + column.clientHeight) {
      column.scrollTo({ top: thumb.offsetTop + thumb.offsetHeight - column.clientHeight })
    }
  }, [index])

  return (
    <div className="relative hidden w-24 shrink-0 lg:block 3xl:w-28">
      <div ref={rail} className="absolute inset-0 flex snap-y snap-mandatory flex-col gap-2 overflow-y-auto scrollbar-none">
        {photos.map((photo, at) => (
          <button
            key={photo.id}
            type="button"
            aria-label={fill(label, { index: at + 1, count: photos.length })}
            aria-current={at === index || undefined}
            onClick={() => onShow(at)}
            className={`relative aspect-square w-full shrink-0 snap-start overflow-hidden rounded-button border-2 bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${frames[at === index ? "current" : "other"]}`}
          >
            <Image loader={thumbLoader} src={photo.id} alt="" fill sizes="(min-width: 1920px) 112px, 96px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
