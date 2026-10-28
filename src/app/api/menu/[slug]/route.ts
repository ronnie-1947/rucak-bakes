import { loadItemLive } from "@/lib/storefront/item"

const NO_STORE = { "Cache-Control": "no-store" }

/**
 * The item page's live part (ItemLive) — the booking window and today's counter. The page itself is prerendered with
 * everything else; its order panel fetches this on mount (src/components/item-detail/ItemOrder.tsx). 404 for a slug that
 * isn't an active item. No sign-in: it's what the page shows.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/menu/[slug]">) {
  const { slug } = await params
  const live = await loadItemLive(slug)
  return Response.json(live, { status: live ? 200 : 404, headers: NO_STORE })
}
