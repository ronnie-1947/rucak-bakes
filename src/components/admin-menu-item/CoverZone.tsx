"use client"

import { type DragEvent, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { fill } from "@/lib/template"
import { PhotoImage } from "./PhotoImage"
import { ProgressRing } from "./ProgressRing"
import type { ItemCopy } from "./types"
import type { PhotoDraft } from "./useItemForm"

type CoverZoneProps = {
  cover: PhotoDraft | null
  onPick: () => void
  onReplace: () => void
  onFiles: (files: File[]) => void
  onRemove: () => void
  onRetry: () => void
  dict: ItemCopy["photos"]
}

const frames: Record<"over" | "failed" | "plain", string> = {
  over: "border-2 border-o500",
  failed: "border-2 border-red",
  plain: "border border-border",
}

const zones: Record<"over" | "idle", string> = {
  over: "border-solid border-o500",
  idle: "border-dashed border-border-strong",
}

function hasFiles(event: DragEvent) {
  return event.dataTransfer.types.includes("Files")
}

/**
 * The 4:3 cover — the biggest thing in the form. Empty, it's a drop zone ("drag a photo here or tap to
 * upload"); filled, the photo with Replace and Remove (always shown on touch, on hover or focus from 1024px).
 */
export function CoverZone({ cover, onPick, onReplace, onFiles, onRemove, onRetry, dict }: CoverZoneProps) {
  const [over, setOver] = useState(false)
  const dropProps = {
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      setOver(true)
    },
    onDragLeave: () => setOver(false),
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      setOver(false)
      onFiles(Array.from(event.dataTransfer.files))
    },
  }

  if (!cover) {
    return (
      <button
        type="button"
        onClick={onPick}
        {...dropProps}
        className={`flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-panel border-2 bg-sunken p-4 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 ${zones[over ? "over" : "idle"]}`}
      >
        <Icon name="upload" className="size-8 text-muted" strokeWidth={1.8} />
        <span className="font-medium">{dict.drop}</span>
        <span className="text-small-admin text-muted">{dict.dropHint}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        {...dropProps}
        className={`group relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-panel bg-sunken ${frames[over ? "over" : cover.status === "failed" ? "failed" : "plain"]}`}
      >
        <PhotoImage photo={cover} width={960} ratio="4:3" />
        <span className="absolute top-2 left-2 rounded-chip bg-o500 px-2 text-micro font-semibold text-foreground">{dict.coverTag}</span>
        {cover.status === "uploading" ? (
          <ProgressRing progress={cover.progress} label={fill(dict.uploading, { percent: Math.round(cover.progress * 100) })} size="lg" />
        ) : null}
        {cover.status === "failed" && cover.error === "failed" ? (
          <Button variant="dangerOutline" size="sm" className="relative" onClick={onRetry}>
            {dict.retry}
          </Button>
        ) : null}
        <div className="absolute right-2 bottom-2 flex gap-2 transition-opacity duration-150 ease-out lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <Button variant="outline" size="sm" onClick={onReplace}>
            {dict.replace}
          </Button>
          <Button variant="outline" size="sm" className="text-red" onClick={onRemove}>
            {dict.remove}
          </Button>
        </div>
      </div>
      {cover.error ? <span className="text-small-admin text-red">{dict[cover.error === "failed" ? "failed" : cover.error]}</span> : null}
    </div>
  )
}
