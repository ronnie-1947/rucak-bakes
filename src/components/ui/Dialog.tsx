"use client"

import { type ReactNode, useEffect, useRef } from "react"
import { CloseIcon } from "@/components/ui/icons/CloseIcon"

type DialogProps = {
  open: boolean
  /** Called on Escape, the close button, and a tap on the scrim. */
  onClose: () => void
  title: ReactNode
  /** Accessible name of the close button (from the dict). */
  closeLabel: string
  children: ReactNode
  /** The action row — rendered on the sunken footer strip. */
  footer?: ReactNode
}

/**
 * A modal on native <dialog> — focus trap, Escape and inertness come from the browser.
 * Under 640px it is a bottom sheet; from `sm` up a centred 440px dialog. Enters at 250ms on the
 * sheet curve, transform and opacity only.
 */
export function Dialog({ open, onClose, title, closeLabel, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click whose target is the <dialog> itself landed on the scrim, outside the panel.
        if (event.target === event.currentTarget) onClose()
      }}
      className="inset-x-0 top-auto bottom-0 m-0 max-h-full w-full max-w-none flex-col overflow-hidden rounded-t-sheet bg-background p-0 text-foreground shadow-raised transition duration-250 ease-sheet backdrop:bg-scrim open:flex starting:open:translate-y-full motion-reduce:transition-none sm:inset-0 sm:m-auto sm:max-w-110 sm:rounded-card sm:starting:open:translate-y-0 sm:starting:open:scale-97 sm:starting:open:opacity-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 py-3 pr-4 pl-6">
        <h2 className="text-h2">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="grid size-11 shrink-0 place-items-center rounded-button text-muted hover:bg-sunken focus-visible:outline-2 focus-visible:outline-o700"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto border-t border-border bg-sunken px-6 pt-4 pb-safe-lg">
        {children}
        {footer ? <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </dialog>
  )
}
