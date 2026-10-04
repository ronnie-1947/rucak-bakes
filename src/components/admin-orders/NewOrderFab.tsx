import { ButtonLink } from "@/components/ui/ButtonLink"
import { Icon } from "@/components/ui/icons/Icon"

type NewOrderFabProps = {
  /** "Add a manual order" — its accessible name and tooltip; the button itself is just the plus. */
  label: string
}

/**
 * The round 56px + to /admin/orders/new (7R.5). It sits last in the queue column and sticks to the foot of the scroll
 * area: above the tab bar on phones whatever the safe area, inside the queue column (clear of the 2xl pane's actions) on
 * wide screens, and pushed to the bottom (`mt-auto`) when the list is short. Its own height keeps the last card uncovered.
 */
export function NewOrderFab({ label }: NewOrderFabProps) {
  return (
    <ButtonLink
      href="/admin/orders/new"
      aria-label={label}
      title={label}
      variant="primary"
      size="inline"
      shape="pill"
      className="sticky bottom-4 z-30 mt-auto size-14 self-end md:bottom-8 print:hidden"
    >
      <Icon name="plus" className="size-6" strokeWidth={2.4} />
    </ButtonLink>
  )
}
