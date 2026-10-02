import Image from "next/image"
import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import { imageUrl } from "@/lib/cloudinary"
import { fill } from "@/lib/template"
import type { MenuCopy } from "./types"

type ItemCoverProps = {
  images: string[]
  isActive: boolean
  dict: MenuCopy
}

const looks: Record<"muted" | "plain", string> = {
  muted: "grayscale-40",
  plain: "",
}

/** The grid card's 4:3 cover — the photo, or a "No photo" prompt; "Inactive" and photo-count markers on top. */
export function ItemCover({ images, isActive, dict }: ItemCoverProps) {
  const cover = images[0]
  return (
    <div
      className={`relative flex aspect-4/3 flex-col items-center justify-center gap-2 overflow-hidden rounded-panel bg-sunken ${looks[isActive ? "plain" : "muted"]}`}
    >
      {cover ? (
        <Image src={imageUrl(cover, { w: 640, ar: "4:3" })} alt="" fill unoptimized className="object-cover" />
      ) : (
        <>
          <Icon name="image" className="size-7 text-subtle" strokeWidth={1.8} />
          <Tag tone="warm">{dict.noPhoto}</Tag>
        </>
      )}
      {images.length > 1 ? (
        <span className="absolute top-2 right-2 flex h-6 items-center rounded-pill border border-border bg-background px-2 text-micro font-semibold tabular-nums">
          {fill(dict.photos, { count: images.length })}
        </span>
      ) : null}
      {isActive ? null : (
        <Tag tone="red" className="absolute top-2 left-2">
          {dict.inactive}
        </Tag>
      )}
    </div>
  )
}
