import Image from "next/image"
import { Icon } from "@/components/ui/icons/Icon"
import { imageUrl } from "@/lib/cloudinary"

type Size = "lg" | "md" | "sm"

type ItemThumbProps = {
  images: string[]
  /** Inactive and archived items: greyed and faded. */
  muted: boolean
  /** lg 56px (menu rows, with a photo-count pill) · md 48px (day editor rows) · sm 36px (previews). */
  size?: Size
}

const looks: Record<"muted" | "plain", string> = {
  muted: "opacity-55 grayscale-40",
  plain: "",
}

const boxes: Record<Size, string> = {
  lg: "size-14",
  md: "size-12",
  sm: "size-9",
}

const pixels: Record<Size, number> = {
  lg: 56,
  md: 48,
  sm: 36,
}

const glyphs: Record<Size, string> = {
  lg: "size-6",
  md: "size-5",
  sm: "size-4",
}

/**
 * A menu item's square: the cover photo, or a picture glyph when there's none. At `lg`, a count pill when
 * there's more than one photo. Cloudinary sizes and compresses the image itself.
 */
export function ItemThumb({ images, muted, size = "lg" }: ItemThumbProps) {
  const cover = images[0]
  const px = pixels[size]
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-chip border border-border bg-sunken ${boxes[size]} ${looks[muted ? "muted" : "plain"]}`}
    >
      {cover ? (
        <Image src={imageUrl(cover, { w: px * 2, ar: "1:1" })} alt="" width={px} height={px} unoptimized className="size-full object-cover" />
      ) : (
        <Icon name="image" className={`${glyphs[size]} text-subtle`} strokeWidth={1.8} />
      )}
      {size === "lg" && images.length > 1 ? (
        <span className="absolute right-1 bottom-1 grid h-4.5 min-w-4.5 place-items-center rounded-pill border border-border bg-background px-1 text-micro font-semibold tabular-nums">
          {images.length}
        </span>
      ) : null}
    </span>
  )
}
