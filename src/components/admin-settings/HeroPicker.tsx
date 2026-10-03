"use client"

import Image from "next/image"
import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { getUploadSignature } from "@/app/actions/cloudinary"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/icons/Icon"
import { imageUrl, type UploadSignature, uploadImage } from "@/lib/cloudinary"
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/menu/form"
import { fill } from "@/lib/template"
import type { SettingsCopy } from "./types"

type HeroPickerProps = {
  /** The chosen photo's public_id — saved or just uploaded. */
  value: string | null
  onChange: (publicId: string | null) => void
  /** While a file is on its way up, Save waits. */
  onUploading: (uploading: boolean) => void
  /** The bakery's name, laid over the foot of the photo the way the landing page shows it. */
  overlay: string
  dict: SettingsCopy["appearance"]
}

type Problem = "wrongType" | "uploadFailed" | "uploadsOff"

/**
 * The landing page photo at 16:9: tap to pick (a JPEG or PNG up to 10 MB), and it uploads straight to
 * Cloudinary with its progress shown. Filled, it has Replace and Remove; the form saves the public_id.
 */
export function HeroPicker({ value, onChange, onUploading, overlay, dict }: HeroPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)

  useEffect(() => {
    return () => {
      if (local) URL.revokeObjectURL(local)
    }
  }, [local])

  const pick = () => input.current?.click()

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setProblem(null)
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) {
      setProblem("wrongType")
      return
    }
    let signature: UploadSignature
    try {
      signature = await getUploadSignature()
    } catch {
      setProblem("uploadsOff")
      return
    }
    setLocal(URL.createObjectURL(file))
    setProgress(0)
    onUploading(true)
    try {
      onChange(await uploadImage(file, signature, { onProgress: setProgress }))
    } catch {
      setProblem("uploadFailed")
    } finally {
      setLocal(null)
      setProgress(null)
      onUploading(false)
    }
  }

  const uploading = progress !== null
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
            className={`size-full object-cover ${uploading ? "opacity-50" : ""}`}
          />
          <span className="absolute inset-x-3 bottom-3 rounded-chip bg-o500 px-3 py-2 font-display text-h2 font-semibold wrap-break-word text-foreground">
            {overlay}
          </span>
          {uploading ? (
            <span role="status" className="absolute inset-0 grid place-items-center text-small-admin font-semibold tabular-nums">
              {fill(dict.uploading, { percent: Math.round((progress ?? 0) * 100) })}
            </span>
          ) : (
            <span className="absolute top-2 right-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={pick}>
                {dict.replace}
              </Button>
              <Button variant="outline" size="sm" className="text-red" onClick={() => onChange(null)}>
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
