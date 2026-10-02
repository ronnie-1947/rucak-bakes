"use client"

import { useRef } from "react"
import { LIMITS, PHOTO_TYPES } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import { AltTextList } from "./AltTextList"
import { inlineError } from "./copy"
import { CoverZone } from "./CoverZone"
import { FormSection } from "./FormSection"
import { GalleryGrid } from "./GalleryGrid"
import type { ItemCopy } from "./types"
import type { ItemForm } from "./useItemForm"

type PhotosSectionProps = {
  form: ItemForm
  dict: ItemCopy
}

type PickTarget = "cover" | "gallery" | "replace"

/**
 * The section that matters most. A 4:3 cover, a 1:1 gallery (6 photos in all), progress rings while
 * uploading, Retry on a failed upload, a drag handle to reorder, and optional alt text per photo.
 * One hidden file input serves every "upload" control.
 */
export function PhotosSection({ form, dict }: PhotosSectionProps) {
  const p = dict.photos
  const input = useRef<HTMLInputElement>(null)
  const target = useRef<PickTarget>("gallery")
  const problem = form.problems.find((candidate) => candidate.section === "photos")

  const pick = (to: PickTarget) => {
    target.current = to
    input.current?.click()
  }

  return (
    <FormSection id="photos" title={p.title} invalid={Boolean(problem)}>
      <input
        ref={input}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ""
          if (target.current === "replace" && files[0]) form.replaceCover(files[0])
          else form.addFiles(files, target.current === "cover" ? "cover" : "gallery")
        }}
      />

      <div className="flex flex-col gap-2">
        <span className="text-small-admin text-muted">{p.cover}</span>
        <CoverZone
          cover={form.photos[0] ?? null}
          onPick={() => pick("cover")}
          onReplace={() => pick("replace")}
          onFiles={(files) => form.addFiles(files, "cover")}
          onRemove={() => form.photos[0] && form.removePhoto(form.photos[0].key)}
          onRetry={() => form.photos[0] && form.retry(form.photos[0].key)}
          dict={p}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-2 text-small-admin text-muted">
          <span>{p.gallery}</span>
          <span className="tabular-nums">{fill(p.count, { count: form.photos.length, max: LIMITS.photos })}</span>
        </div>
        <GalleryGrid form={form} onPick={() => pick("gallery")} dict={p} />
        {form.photos.length >= LIMITS.photos ? <span className="text-small-admin text-muted">{p.full}</span> : null}
        {problem ? (
          <span role="alert" className="text-small-admin text-red">
            {inlineError(problem.code, dict, problem.values)}
          </span>
        ) : null}
      </div>

      {form.photos.length > 0 ? <AltTextList form={form} dict={p} /> : null}
    </FormSection>
  )
}
