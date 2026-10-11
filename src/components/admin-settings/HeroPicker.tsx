"use client"

import Image from "next/image"
import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { useImageUpload } from "@/hooks/useImageUpload"
import { imageUrl, UploadError } from "@/lib/cloudinary"
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type HeroPickerProps = {
  /** The saved photo's public_id. */
  value: string | null
  /** Saves the new photo (null removes it); resolves false when the save didn't land. */
  onChange: (publicId: string | null) => Promise<boolean>
  /** The bakery's name, laid over the foot of the photo the way the landing page shows it. */
  overlay: string
  dict: SettingsCopy["appearance"]
}

type Problem = "wrongType" | "uploadFailed" | "uploadsOff" | "saveFailed"

/**
 * The landing page photo at 16:9: tap to pick (a JPEG or PNG up to 10 MB). Three steps, no Save press:
 * 1. upload straight to Cloudinary, progress shown; 2. save the new public_id (onChange); 3. the save deletes
 * the previous photo from Cloudinary. A save that fails discards the new upload instead. Filled, it has
 * Replace and Remove; Remove saves at once too.
 */
export function HeroPicker({ value, onChange, overlay, dict }: HeroPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<Problem | null>(null)
  const images = useImageUpload()

  useEffect(() => {
    return () => {
      if (local) URL.revokeObjectURL(local)
    }
  }, [local])

  const pick = () => input.current?.click()

  /** Steps 2 and 3 — the save, which also deletes the photo it replaces. */
  const save = async (publicId: string | null) => {
    setSaving(true)
    const saved = await onChange(publicId)
    if (!saved) {
      setProblem("saveFailed")
      if (publicId) images.discard(publicId)
    }
    setSaving(false)
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setProblem(null)
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) {
      setProblem("wrongType")
      return
    }
    setLocal(URL.createObjectURL(file))
    setProgress(0)
    try {
      // Step 1 — the upload.
      const publicId = await images.upload(file, { onProgress: setProgress })
      setProgress(null)
      await save(publicId)
    } catch (error) {
      setProblem(error instanceof UploadError && error.reason === "unavailable" ? "uploadsOff" : "uploadFailed")
    } finally {
      setLocal(null)
      setProgress(null)
    }
  }

  const remove = () => {
    setProblem(null)
    void save(null)
  }

  const uploading = progress !== null
  const busy = uploading || saving
  const src = local ?? (value ? imageUrl(value, { w: 1280, ar: "16:9" }) : null)

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" accept={PHOTO_TYPES.join(",")} onChange={upload} className="sr-only" tabIndex={-1} aria-hidden />
      {src ? (
        <div className="relative aspect-video overflow-hidden rounded-panel border border-border bg-sunken">
          <Image
            src={src}
            alt={dict.heroAlt}
            width={640}
            height={360}
            unoptimized
            className={`size-full object-cover ${busy ? "opacity-50" : ""}`}
          />
          <span className="absolute inset-x-3 bottom-3 rounded-chip bg-o500 px-3 py-2 font-display text-h2 font-semibold wrap-break-word text-foreground">
            {overlay}
          </span>
          {busy ? (
            <span role="status" className="absolute inset-0 grid place-items-center text-small-admin font-semibold tabular-nums">
              {uploading ? fill(dict.uploading, { percent: Math.round((progress ?? 0) * 100) }) : dict.saving}
            </span>
          ) : (
            <span className="absolute top-2 right-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={pick}>
                {dict.replace}
              </Button>
              <Button variant="outline" size="sm" className="text-red" onClick={remove}>
                {dict.remove}
              </Button>
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-border-strong bg-sunken p-3 text-center text-small-admin font-medium hover:border-o500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700 disabled:opacity-50"
        >
          <Icon name="upload" className="size-6 text-muted" />
          {dict.heroEmpty}
        </button>
      )}
      {problem ? (
        <span role="alert" className="text-small-admin text-red">
          {dict[problem]}
        </span>
      ) : null}
    </div>
  )
}
