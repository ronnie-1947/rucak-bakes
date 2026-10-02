"use client"

import type { KeyboardEvent, PointerEvent } from "react"
import { Button } from "@/components/ui/Button"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { PhotoImage } from "./PhotoImage"
import { ProgressRing } from "./ProgressRing"
import type { ItemCopy } from "./types"
import type { PhotoDraft } from "./useItemForm"

type HandleProps = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

type PhotoTileProps = {
  photo: PhotoDraft
  /** Position in the whole photo list (1 is the first gallery photo) — the reorder target index. */
  index: number
  dragging: boolean
  handle: HandleProps
  onRemove: () => void
  onRetry: () => void
  onSetCover: () => void
  dict: ItemCopy["photos"]
}

const frames: Record<"failed" | "dragging" | "plain", string> = {
  failed: "border-2 border-red",
  dragging: "border-2 border-o500 opacity-70",
  plain: "border border-border",
}

/**
 * One 1:1 gallery photo: drag handle (top left), remove (top right), "Set as cover" once uploaded, a
 * progress ring while uploading and Retry when it failed. Every control is a 44px target.
 */
export function PhotoTile({ photo, index, dragging, handle, onRemove, onRetry, onSetCover, dict }: PhotoTileProps) {
  const frame = photo.status === "failed" ? "failed" : dragging ? "dragging" : "plain"
  return (
    <div data-reorder="gallery" data-reorder-index={index} className="flex min-w-0 flex-col gap-1">
      <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-panel bg-sunken ${frames[frame]}`}>
        <PhotoImage photo={photo} width={320} ratio="1:1" />
        {photo.status === "uploading" ? (
          <ProgressRing progress={photo.progress} label={fill(dict.uploading, { percent: Math.round(photo.progress * 100) })} size="md" />
        ) : null}
        {photo.status === "failed" && photo.error === "failed" ? (
          <Button variant="dangerOutline" size="sm" className="relative" onClick={onRetry}>
            {dict.retry}
          </Button>
        ) : null}
        <button
          type="button"
          aria-label={fill(dict.move, { n: index + 1 })}
          {...handle}
          className="absolute top-0 left-0 grid size-11 cursor-grab touch-none place-items-center focus-visible:outline-2 focus-visible:outline-o700 active:cursor-grabbing"
        >
          <span className="grid size-7 place-items-center rounded-chip border border-border bg-background text-muted">
            <Icon name="grip" className="size-3.5" strokeWidth={3} />
          </span>
        </button>
        <button
          type="button"
          aria-label={fill(dict.removeOne, { n: index + 1 })}
          onClick={onRemove}
          className="absolute top-0 right-0 grid size-11 place-items-center focus-visible:outline-2 focus-visible:outline-o700"
        >
          <span className="grid size-7 place-items-center rounded-pill border border-border bg-background">
            <CloseIcon className="size-3" />
          </span>
        </button>
        {photo.status === "done" ? (
          <button
            type="button"
            onClick={onSetCover}
            className="absolute inset-x-0 bottom-0 flex h-11 items-end justify-center pb-1 focus-visible:outline-2 focus-visible:outline-o700"
          >
            <span className="rounded-pill border border-border bg-background px-2 text-micro font-semibold whitespace-nowrap">{dict.setCover}</span>
          </button>
        ) : null}
      </div>
      {photo.error ? <span className="text-micro text-red">{dict[photo.error === "failed" ? "failed" : photo.error]}</span> : null}
    </div>
  )
}
