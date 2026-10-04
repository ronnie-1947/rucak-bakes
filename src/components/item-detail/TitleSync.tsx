"use client"

import { usePageTitle } from "@/hooks/usePageTitle"

type TitleSyncProps = {
  text: string
  /** The id of the page's h1. */
  target: string
}

/** Hands the item's name to the store header, which fades it in once the h1 has scrolled away. Renders nothing. */
export function TitleSync({ text, target }: TitleSyncProps) {
  usePageTitle(text, target)
  return null
}
