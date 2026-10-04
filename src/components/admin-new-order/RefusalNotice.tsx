import { Notice } from "@/components/ui/Notice"
import { refusalText } from "./copy"
import type { NewOrderCopy, Refusal } from "./types"

type RefusalNoticeProps = {
  refusal: Refusal | null
  dict: NewOrderCopy
}

/** Why the last Add order didn't go through, right above the button that sent it. Gone at the next change. */
export function RefusalNotice({ refusal, dict }: RefusalNoticeProps) {
  if (!refusal) return null
  return <Notice tone="error">{refusalText(refusal, dict)}</Notice>
}
