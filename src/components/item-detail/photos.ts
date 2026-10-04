import type { ImageLoader } from "next/image"
import { imageUrl } from "@/lib/cloudinary"

/** One of the item's photos: a Cloudinary public_id and the owner's alt text ("" when none). Client-safe. */
export type Photo = { id: string; alt: string }

/** next/image asks for each width its srcset needs; Cloudinary crops and sizes to it. */
export const coverLoader: ImageLoader = ({ src, width }) => imageUrl(src, { w: width, ar: "4:3" })

export const thumbLoader: ImageLoader = ({ src, width }) => imageUrl(src, { w: width, ar: "1:1" })
