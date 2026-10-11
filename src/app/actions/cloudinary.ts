"use server"

import { requireStaff } from "@/auth"
import type { UploadSignature } from "@/lib/cloudinary"
import { type DeleteImageResult, deleteFromCloudinary, signUpload } from "@/lib/cloudinary-server"

/**
 * The browser's way in to src/lib/cloudinary-server.ts, staff only. Components reach these through the
 * useImageUpload hook; server actions call the lib directly.
 */

export type { DeleteImageResult }

/** Signs one direct browser upload into the bakery's folder. The API secret never leaves the server. */
export async function getUploadSignature(): Promise<UploadSignature> {
  await requireStaff()
  return signUpload()
}

/** Destroys an uploaded image by public_id or URL, once nothing points at it — see deleteFromCloudinary. */
export async function deleteImage(urlOrId: string): Promise<DeleteImageResult> {
  await requireStaff()
  return deleteFromCloudinary(urlOrId)
}
