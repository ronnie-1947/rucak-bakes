/**
 * Cloudinary, browser-safe half. Signing and deleting live in src/app/actions/cloudinary.ts —
 * the API secret never reaches this file or the browser.
 *
 * Store the public_id only, never a full URL: URLs are built at render time, so sizes and formats
 * can change without touching the database.
 */

/** Every upload lands here — the signature pins it, so a browser can't write anywhere else. */
export const CLOUDINARY_FOLDER = "sabiha-bakery"

const PUBLIC_ID = new RegExp(`^${CLOUDINARY_FOLDER}/[A-Za-z0-9_-]+$`)

/** An auto-generated id inside our folder — the only shape this app ever creates or accepts back. */
export function isOurPublicId(value: string): boolean {
  return PUBLIC_ID.test(value)
}

/** What getUploadSignature() hands the browser for one direct upload. */
export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

type ImageOptions = {
  /** Delivered width in pixels — size it to the slot it fills, times device density. */
  w: number
  /** Crop to an aspect ratio: "4:3" for covers, "1:1" for the gallery. Omitted keeps the original shape. */
  ar?: string
}

/** A delivery URL for a stored public_id, with automatic format and quality. */
export function imageUrl(publicId: string, { w, ar }: ImageOptions): string {
  const transforms = ar ? `f_auto,q_auto,c_fill,g_auto,ar_${ar},w_${w}` : `f_auto,q_auto,c_limit,w_${w}`
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

type UploadOptions = {
  /** 0–1, for the progress ring. */
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/**
 * Uploads a file straight from the browser to Cloudinary under a server-issued signature, and resolves
 * to the public_id to post back. XHR rather than fetch: fetch can't report upload progress.
 */
export function uploadImage(file: File, signature: UploadSignature, { onProgress, signal }: UploadOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append("file", file)
    body.append("api_key", signature.apiKey)
    body.append("timestamp", String(signature.timestamp))
    body.append("signature", signature.signature)
    body.append("folder", signature.folder)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve((JSON.parse(xhr.responseText) as { public_id: string }).public_id)
      else reject(new Error(`Cloudinary upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error("Cloudinary upload failed (network)"))
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"))
    signal?.addEventListener("abort", () => xhr.abort(), { once: true })
    xhr.send(body)
  })
}
