"use client"

import { type DragEvent, useState } from "react"
import { Icon } from "@/components/ui/icons/Icon"
import { LIMITS } from "@/lib/menu/form"
import { PhotoTile } from "./PhotoTile"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"
import { useReorder } from "./useReorder"

type GalleryGridProps = {
  form: ItemForm
  onPick: () => void
  dict: ItemCopy["photos"]
}

const zones: Record<"over" | "idle", string> = {
  over: "border-solid border-o500",
  idle: "border-dashed border-border-strong",
}

/** Every photo after the cover, 3 across on phones and 4 from 768px, then the "Add photos" tile while there's room. */
export function GalleryGrid({ form, onPick, dict }: GalleryGridProps) {
  const [over, setOver] = useState(false)
  const { dragging, handleProps } = useReorder("gallery", form.movePhoto)
  const gallery = form.photos.slice(1)

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
      {gallery.map((photo, offset) => (
        <PhotoTile
          key={photo.key}
          photo={photo}
          index={offset + 1}
          dragging={dragging === photo.key}
          handle={handleProps(photo.key, offset + 1)}
          onRemove={() => form.removePhoto(photo.key)}
          onRetry={() => form.retry(photo.key)}
          onSetCover={() => form.setCover(photo.key)}
          dict={dict}
        />
      ))}
      {form.photos.length < LIMITS.photos ? (
        <button
          type="button"
          onClick={onPick}
          onDragOver={(event: DragEvent) => {
            if (!event.dataTransfer.types.includes("Files")) return
            event.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event: DragEvent) => {
            if (!event.dataTransfer.types.includes("Files")) return
            event.preventDefault()
            setOver(false)
            form.addFiles(Array.from(event.dataTransfer.files), "gallery")
          }}
          className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-panel border-2 bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${zones[over ? "over" : "idle"]}`}
        >
          <Icon name="plus" className="size-5 text-muted" />
          <span className="text-small-admin font-medium">{dict.add}</span>
        </button>
      ) : null}
    </div>
  )
}
