import { v2 as cloudinary } from "cloudinary"
import { CLOUDINARY_FOLDER, toPublicId, type UploadSignature } from "@/lib/cloudinary"
import { prisma } from "@/lib/db"

/**
 * Cloudinary, server half — the only code that holds the API secret. No auth here: server actions call
 * these after their own requireStaff() / requireOwner(); the browser reaches them only through
 * src/app/actions/cloudinary.ts.
 */

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured — see .env.example")
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true })
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET }
}

/** Signs one direct browser upload into the bakery's folder. */
export function signUpload(): UploadSignature {
  const { cloudName, apiKey, apiSecret } = configure()
  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request({ folder: CLOUDINARY_FOLDER, timestamp }, apiSecret)
  return { cloudName, apiKey, timestamp, signature, folder: CLOUDINARY_FOLDER }
}

export type DeleteImageResult = { ok: true } | { ok: false; reason: "INVALID" | "IN_USE" }

/**
 * Destroys an image by its public_id or any delivery URL of it — but only once nothing points at it: a photo
 * removed from an unsaved form is still on the saved item, and destroying it would break that item's page.
 * So a replaced photo is deleted *after* the save that replaces it, never before.
 */
export async function deleteFromCloudinary(urlOrId: string): Promise<DeleteImageResult> {
  const publicId = typeof urlOrId === "string" ? toPublicId(urlOrId) : null
  if (!publicId) return { ok: false, reason: "INVALID" }

  const [items, heroes] = await Promise.all([
    prisma.menuItem.count({ where: { images: { has: publicId } } }),
    prisma.settings.count({ where: { heroImage: publicId } }),
  ])
  if (items + heroes > 0) return { ok: false, reason: "IN_USE" }

  configure()
  await cloudinary.uploader.destroy(publicId, { invalidate: true })
  return { ok: true }
}
