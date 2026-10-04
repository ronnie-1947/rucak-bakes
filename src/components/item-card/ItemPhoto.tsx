import Image from "next/image"
import { Icon } from "@/components/ui/icons/Icon"
import { Tag } from "@/components/ui/Tag"
import { imageUrl } from "@/lib/cloudinary"
import type { ItemChip } from "./card"

type ItemPhotoProps = {
  image: string | null
  alt: string
  chip: ItemChip | null
  /** A sold-out counter-item — greyed. */
  muted: boolean
}

const looks: Record<"muted" | "plain", string> = {
  muted: "grayscale-40",
  plain: "",
}

/**
 * The card's 4:3 photo on a sunken placeholder, with a chip in the top-left corner. Cloudinary crops and sizes
 * it: 640px wide covers a 305px card at 2x.
 */
export function ItemPhoto({ image, alt, chip, muted }: ItemPhotoProps) {
  return (
    <div className={`relative grid aspect-4/3 place-items-center overflow-hidden rounded-panel bg-sunken ${looks[muted ? "muted" : "plain"]}`}>
      {image ? (
        <Image src={imageUrl(image, { w: 640, ar: "4:3" })} alt={alt} width={320} height={240} unoptimized className="absolute inset-0 size-full object-cover" />
      ) : (
        <Icon name="image" className="size-8 text-subtle" strokeWidth={1.6} />
      )}
      {chip ? (
        <Tag tone={chip.tone} className="absolute top-2 left-2">
          {chip.text}
        </Tag>
      ) : null}
    </div>
  )
}
