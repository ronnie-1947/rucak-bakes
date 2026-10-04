"use client"

import { useRouter } from "next/navigation"
import { UndoBar } from "@/components/ui/UndoBar"
import { fill } from "@/lib/template"
import type { DetailCopy } from "./types"

type AddedBarProps = {
  orderId: string
  code: string
  /** The customer's first name — "BK-4830 added for Meera — verified". */
  name: string
  dict: DetailCopy
}

/**
 * Arriving from New order (`?added=1`): the green line saying it worked, and Add another. Survives a reload; dismissing it
 * drops `?added` from the URL.
 */
export function AddedBar({ orderId, code, name, dict }: AddedBarProps) {
  const router = useRouter()
  return (
    <UndoBar
      text={fill(dict.added, { code, name })}
      link={{ href: "/admin/orders/new", label: dict.addAnother }}
      dismissLabel={dict.dismiss}
      onDismiss={() => router.replace(`/admin/orders/${orderId}`, { scroll: false })}
    />
  )
}
