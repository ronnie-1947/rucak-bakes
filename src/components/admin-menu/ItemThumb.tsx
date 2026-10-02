import Image from "next/image"
import { Icon } from "@/components/ui/icons/Icon"
import { imageUrl } from "@/lib/cloudinary"

type ItemThumbProps = {
  images: string[]
  /** Inactive and archived items: greyed and faded. */
  muted: boolean
}

const looks: Record<"muted" | "plain", string> = {
  muted: "opacity-55 grayscale-40",
  plain: "",
}

/**
 * The 56px square in list rows and table cells: the cover photo, or a picture glyph when there's none.
 * A count pill when there's more than one photo. Cloudinary sizes and compresses the image itself.
 */
export function ItemThumb({ images, muted }: ItemThumbProps) {
  const cover = images[0]
  return (
    <span
      className={`relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-chip border border-border bg-sunken ${looks[muted ? "muted" : "plain"]}`}
    >
      {cover ? (
        <Image src={imageUrl(cover, { w: 112, ar: "1:1" })} alt="" width={56} height={56} unoptimized className="size-full object-cover" />
      ) : (
        <Icon name="image" className="size-6 text-subtle" strokeWidth={1.8} />
      )}
      {images.length > 1 ? (
        <span className="absolute right-1 bottom-1 grid h-4.5 min-w-4.5 place-items-center rounded-pill border border-border bg-background px-1 text-micro font-semibold tabular-nums">
          {images.length}
        </span>
      ) : null}
    </span>
  )
}
