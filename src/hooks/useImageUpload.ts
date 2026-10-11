"use client"

import { useCallback, useMemo, useRef } from "react"
import { deleteImage, getUploadSignature } from "@/app/actions/cloudinary"
import { type UploadSignature, UploadError, uploadImage } from "@/lib/cloudinary"

/** Cloudinary signatures last an hour; refresh well inside that. */
const SIGNATURE_TTL_MS = 30 * 60 * 1000

type UploadOptions = {
  /** 0–1, for the progress ring. */
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/**
 * Uploading to and deleting from Cloudinary from a component — the item form's photos and the landing photo.
 * `upload` sends a file straight to Cloudinary and resolves to its public_id, rejecting with an UploadError
 * (`unavailable` when uploads aren't set up, `failed` otherwise) or an AbortError. One signature is shared
 * across uploads until it nears expiry. `discard` drops an upload that never got saved; it's best effort,
 * and the server refuses anything still in use.
 */
export function useImageUpload() {
  const signature = useRef<{ at: number; promise: Promise<UploadSignature> } | null>(null)

  const freshSignature = useCallback(() => {
    if (!signature.current || Date.now() - signature.current.at > SIGNATURE_TTL_MS) {
      const promise = getUploadSignature()
      signature.current = { at: Date.now(), promise }
      promise.catch(() => (signature.current = null))
    }
    return signature.current.promise
  }, [])

  const upload = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<string> => {
      let signed: UploadSignature
      try {
        signed = await freshSignature()
      } catch {
        throw new UploadError("unavailable")
      }
      return uploadImage(file, signed, options)
    },
    [freshSignature],
  )

  const discard = useCallback((publicId: string) => {
    void deleteImage(publicId).catch(() => undefined)
  }, [])

  return useMemo(() => ({ upload, discard }), [upload, discard])
}
