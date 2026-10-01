import type { ElementType, ReactNode } from "react"

type Width = "narrow" | "default" | "wide"

type ContainerProps = {
  children: ReactNode
  /** Content max-width. `narrow` for prose, `wide` for full-bleed grids. */
  width?: Width
  /** Render as a different element — e.g. "section", "header", "main". */
  as?: ElementType
  className?: string
}

const widths: Record<Width, string> = {
  narrow: "max-w-3xl",
  default: "max-w-7xl 2xl:max-w-[88rem] 3xl:max-w-[100rem]",
  wide: "max-w-none",
}

/** Gutters grow with the viewport so content never touches the edge at 320px or looks cramped at 1920px. */
const gutters = "px-4 xxs:px-5 xs:px-6 sm:px-8 lg:px-10 2xl:px-14 3xl:px-20"

export function Container({ children, width = "default", as: Tag = "div", className }: ContainerProps) {
  return <Tag className={`mx-auto w-full ${widths[width]} ${gutters} ${className ?? ""}`}>{children}</Tag>
}
