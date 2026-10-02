import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import { defaultLocale, getDictionary } from "@/lib/i18n"
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
    title: dict.meta.home.title,
    description: dict.meta.home.description,
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-body text-foreground tabular-nums">{children}</body>
    </html>
  )
}
