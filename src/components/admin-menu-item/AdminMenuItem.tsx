import { MenuActionsProvider } from "@/components/menu-actions/MenuActionsProvider"
import type { MenuItemPage } from "@/lib/menu/item"
import { MenuItemForm } from "./MenuItemForm"
import type { AdminCopy } from "./types"

type AdminMenuItemProps = {
  dict: AdminCopy
  page: MenuItemPage
  justCreated: boolean
}

/**
 * /admin/menu/new and /admin/menu/[id]. The provider sits outside the form so its undo strip survives
 * the form remounting — which it does when the item is archived or restored, to pick up the new state.
 */
export function AdminMenuItem({ dict, page, justCreated }: AdminMenuItemProps) {
  return (
    <MenuActionsProvider dict={dict.menu} statusPlacement="manual">
      <MenuItemForm key={`${page.id ?? "new"}:${page.archivedLabel ?? "live"}`} page={page} justCreated={justCreated} dict={dict} />
    </MenuActionsProvider>
  )
}
