import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  env: {
    // Not a secret — it's in every image URL. Inlined so imageUrl() works in client components too.
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  },
  async headers() {
    return [
      {
        // The service worker is never served from an HTTP cache, so a deploy that changes it reaches every phone.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ]
  },
}

export default nextConfig
