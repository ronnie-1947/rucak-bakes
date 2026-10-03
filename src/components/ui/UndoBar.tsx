import Link from "next/link"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"

type UndoBarProps = {
  text: string
  /** A way on from the change — "Open it" for a duplicate. */
  link?: { href: string; label: string }
  /** Omitted for a change that has no undo (Copy last week) — the line just reports it. */
  undo?: { label: string; onUndo: () => void; pending: boolean }
  dismissLabel: string
  onDismiss: () => void
}

/** The green line a change leaves behind — what happened, and the way back. Stays until dismissed or replaced. */
export function UndoBar({ text, link, undo, dismissLabel, onDismiss }: UndoBarProps) {
  return (
    <div role="status" className="flex items-center gap-2 rounded-panel bg-green-soft pl-3">
      <CheckIcon className="size-4 shrink-0 text-green" />
      <span className="min-w-0 flex-1 text-small-admin font-semibold text-green tabular-nums">{text}</span>
      {link ? (
        <Link href={link.href} className="flex min-h-11 items-center px-3 text-small-admin font-semibold text-o700 hover:underline">
          {link.label}
        </Link>
      ) : null}
      {undo ? (
        <button
          type="button"
          disabled={undo.pending}
          onClick={undo.onUndo}
          className="min-h-11 rounded-button px-3 text-small-admin font-semibold text-o700 hover:underline focus-visible:outline-2 focus-visible:outline-o700 disabled:opacity-50"
        >
          {undo.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="grid size-11 shrink-0 place-items-center rounded-button text-green focus-visible:outline-2 focus-visible:outline-o700"
      >
        <CloseIcon />
      </button>
    </div>
  )
}
