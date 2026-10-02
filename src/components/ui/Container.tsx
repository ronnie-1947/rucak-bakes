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

/** Design-system gutters (§2): 16px mobile, 24px tablet, 32px desktop. */
const gutters = "px-4 md:px-6 lg:px-8"

export function Container({ children, width = "default", as: Tag = "div", className }: ContainerProps) {
  return <Tag className={`mx-auto w-full ${widths[width]} ${gutters} ${className ?? ""}`}>{children}</Tag>
}
