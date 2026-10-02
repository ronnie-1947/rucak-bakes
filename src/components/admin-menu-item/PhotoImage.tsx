import Image from "next/image"
import { imageUrl } from "@/lib/cloudinary"
import type { PhotoDraft } from "./useItemForm"

type PhotoImageProps = {
  photo: Pick<PhotoDraft, "publicId" | "localUrl" | "alt" | "status">
  /** Delivered width in pixels, and the crop. */
  width: number
  ratio: "4:3" | "1:1"
}

const looks: Record<PhotoDraft["status"], string> = {
  done: "",
  uploading: "opacity-45",
  failed: "opacity-50",
}

/**
 * A photo filling its (positioned) box: the picked file while it's in this session, otherwise the
 * Cloudinary rendition. Faded while uploading or failed.
 */
export function PhotoImage({ photo, width, ratio }: PhotoImageProps) {
  const src = photo.localUrl ?? (photo.publicId ? imageUrl(photo.publicId, { w: width, ar: ratio }) : null)
  if (!src) return null
  return <Image src={src} alt={photo.alt} fill unoptimized className={`object-cover ${looks[photo.status]}`} />
}
