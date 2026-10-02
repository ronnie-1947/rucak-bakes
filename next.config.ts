import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  env: {
    // Not a secret — it's in every image URL. Inlined so imageUrl() works in client components too.
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  },
}

export default nextConfig
