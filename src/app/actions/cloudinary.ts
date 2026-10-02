"use server"

import { v2 as cloudinary } from "cloudinary"
import { requireStaff } from "@/auth"
import { CLOUDINARY_FOLDER, isOurPublicId, type UploadSignature } from "@/lib/cloudinary"
import { prisma } from "@/lib/db"

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured — see .env.example")
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true })
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET }
}

/** Signs one direct browser upload into the bakery's folder. The API secret never leaves the server. */
export async function getUploadSignature(): Promise<UploadSignature> {
  await requireStaff()
  const { cloudName, apiKey, apiSecret } = configure()
  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request({ folder: CLOUDINARY_FOLDER, timestamp }, apiSecret)
  return { cloudName, apiKey, timestamp, signature, folder: CLOUDINARY_FOLDER }
}

export type DeleteImageResult = { ok: true } | { ok: false; reason: "INVALID" | "IN_USE" }

/**
 * Destroys an uploaded image, but only once nothing points at it: a photo removed from an unsaved
 * form is still on the saved item, and destroying it would break that item's page.
 */
export async function deleteImage(publicId: string): Promise<DeleteImageResult> {
  await requireStaff()
  if (typeof publicId !== "string" || !isOurPublicId(publicId)) return { ok: false, reason: "INVALID" }

  const [items, heroes] = await Promise.all([
    prisma.menuItem.count({ where: { images: { has: publicId } } }),
    prisma.settings.count({ where: { heroImage: publicId } }),
  ])
  if (items + heroes > 0) return { ok: false, reason: "IN_USE" }

  configure()
  await cloudinary.uploader.destroy(publicId, { invalidate: true })
  return { ok: true }
}
