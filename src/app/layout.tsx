import type { Metadata, Viewport } from "next"
import { Fraunces, Inter } from "next/font/google"
import { defaultLocale, getDictionary } from "@/lib/i18n"
import { APP_THEME_COLOR } from "@/lib/pwa/app"
import { siteUrl } from "@/lib/site"
import "./globals.css"

/** Headings only, at the one weight the design system allows. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "600",
})

/** Variable font — 400/500/600 from one file. latin-ext carries ₹ (U+20B9), which prices need. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
})

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale)
  return {
    // Relative canonical and Open Graph URLs resolve against it.
    metadataBase: siteUrl(),
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    openGraph: { type: "website", siteName: dict.meta.home.title, locale: "en_IN", title: dict.meta.home.title, description: dict.meta.home.description },
    // favicon.ico is the app/ file convention (Next lists it first); the rest live in public/favicon/.
    icons: {
      icon: [
        { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      // Opaque white: iOS fills a transparent touch icon with black.
      apple: { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    },
    // The manifest (app/manifest.ts) is linked by Next itself. iOS reads these instead: home-screen label, full-screen launch.
    applicationName: dict.meta.app.name,
    appleWebApp: { capable: true, title: dict.meta.app.shortName, statusBarStyle: "default" },
  }
}

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-body text-foreground tabular-nums">{children}</body>
    </html>
  )
}
