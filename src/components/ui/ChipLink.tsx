import Link from "next/link"
import type { ReactNode } from "react"
import { chipClasses } from "@/components/ui/Chip"

type ChipLinkProps = {
  href: string
  children: ReactNode
  selected: boolean
  className?: string
}

/** A chip that navigates — filters kept in the URL work without JavaScript. */
export function ChipLink({ href, children, selected, className }: ChipLinkProps) {
  return (
    <Link href={href} scroll={false} aria-current={selected ? "true" : undefined} className={chipClasses(selected, className)}>
      {children}
    </Link>
  )
}
