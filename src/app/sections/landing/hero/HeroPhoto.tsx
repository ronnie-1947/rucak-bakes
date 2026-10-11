"use client"

import Image, { type ImageLoader } from "next/image"
import { imageUrl } from "@/lib/cloudinary"

/** Uncropped: the frame is near-square on a phone and 21:9 on a laptop, so object-cover does the crop. Capped at 2560 — the widest slot at 2×. */
const heroLoader: ImageLoader = ({ src, width }) => imageUrl(src, { w: Math.min(width, 2560) })

type HeroPhotoProps = {
  /** A Cloudinary public_id. */
  image: string
}

/**
 * The hero photo as a srcset — Cloudinary sizes each width, so a phone fetches ~800px rather than the 2560px a
 * wide desktop needs. Client only because a loader is a function, which can't cross from a Server Component.
 */
export function HeroPhoto({ image }: HeroPhotoProps) {
  return (
    <Image
      loader={heroLoader}
      src={image}
      alt=""
      fill
      preload
      // The main Container's content width at each step: 1216 / 1344 / 1536px, full width below 1280px.
      sizes="(min-width: 1920px) 1536px, (min-width: 1600px) 1344px, (min-width: 1280px) 1216px, 100vw"
      className="-z-10 object-cover"
    />
  )
}
