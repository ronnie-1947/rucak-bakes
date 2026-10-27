"use client"

import { useLinkStatus } from "next/link"
import { Icon, type IconName } from "@/components/ui/icons/Icon"
import { Spinner } from "@/components/ui/Spinner"
import type { NavVariant } from "./nav"

type NavIconProps = {
  icon: IconName
  variant: NavVariant
}

const boxes: Record<NavVariant, string> = {
  sidebar: "size-5",
  tab: "size-6",
}

const tones: Record<NavVariant, "inverse" | "accent"> = {
  sidebar: "inverse",
  tab: "accent",
}

/** A nav glyph that turns into a spinner, in the same box, while its link's navigation is pending. Must sit inside the Link. */
export function NavIcon({ icon, variant }: NavIconProps) {
  const { pending } = useLinkStatus()
  if (!pending) return <Icon name={icon} className={boxes[variant]} />

  return (
    <span className={`flex shrink-0 items-center justify-center ${boxes[variant]}`}>
      <Spinner tone={tones[variant]} />
    </span>
  )
}
