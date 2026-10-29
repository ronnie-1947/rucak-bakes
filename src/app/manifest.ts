import type { MetadataRoute } from "next"
import { defaultLocale, getDictionary } from "@/lib/i18n"
import { APP_BACKGROUND_COLOR, APP_THEME_COLOR } from "@/lib/pwa/app"

/**
 * /manifest.webmanifest — what makes the store installable from the browser's own menu (Chrome's Install app, iOS's
 * Add to Home Screen). The store shows no install button of its own. Static.
 * The `any` icons are the transparent cupcake; the `maskable` ones put it on white inside the 80% safe zone, so
 * Android's round or squircle mask never clips it.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const dict = await getDictionary(defaultLocale)
  return {
    id: "/",
    name: dict.meta.app.name,
    short_name: dict.meta.app.shortName,
    description: dict.meta.home.description,
    lang: "en-IN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: APP_BACKGROUND_COLOR,
    theme_color: APP_THEME_COLOR,
    categories: ["food", "shopping"],
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/favicon/maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/favicon/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
