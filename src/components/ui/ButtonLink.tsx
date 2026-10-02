import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/Button"

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Navigation that looks like a Button. Same class map — a second button look is never defined here. */
export function ButtonLink({ children, variant = "primary", size = "md", className, ...link }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...link}>
      {children}
    </Link>
  )
}
