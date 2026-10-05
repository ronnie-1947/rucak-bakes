import Link from "next/link"
import { Icon } from "@/components/ui/icons/Icon"

type AddFabProps = {
  label: string
}

/**
 * Phones only: the round Add item button, 16px above the tab bar. Sticky at the end of the screen, so it
 * rides the bottom of the scroll area without covering the last row once you reach it.
 */
export function AddFab({ label }: AddFabProps) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-30 flex justify-end px-4 md:hidden">
      <Link
        href="/admin/menu/new"
        aria-label={label}
        className="pointer-events-auto grid size-14 place-items-center rounded-pill border-2 border-background bg-o700 text-background shadow-raised transition-transform duration-150 ease-out active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o700"
      >
        <Icon name="plus" className="size-6" strokeWidth={2.4} />
      </Link>
    </div>
  )
}
