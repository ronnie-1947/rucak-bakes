import { todayIn } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { defaultLocale, getDictionary } from "@/lib/i18n"
import type { PlacedOrder } from "@/lib/orders/place"
import { recordDelivery } from "@/lib/settings/telegram"
import { formatOrderMessage, notifyOwner } from "@/lib/telegram"

/**
 * Tells the owner about a new order — AFTER the order committed. A messaging outage must never roll
 * back a real order: any failure only sets `notificationFailed`, which the admin orders screen shows
 * as a banner. Never throws. A replayed submit (`created: false`) sends nothing.
 */
export async function notifyNewOrder(order: PlacedOrder, origin: string): Promise<void> {
  if (!order.created) return
  try {
    const dict = await getDictionary(defaultLocale)
    const text = formatOrderMessage(
      {
        code: order.code,
        fulfilmentDate: order.fulfilmentDate,
        fulfilmentType: order.fulfilmentType,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        previousOrders: order.previousOrders,
        autoVerified: order.autoVerified,
        isSuspected: order.isSuspected,
        items: order.items,
        totalPaise: order.totalPaise,
        customerNote: order.customerNote,
        pendingCount: order.pendingCount,
        maxOrders: order.maxOrders,
        today: todayIn(order.timezone),
        url: `${origin}/admin/orders/${order.id}`,
      },
      dict.telegram,
    )
    await notifyOwner(text, order.telegramChatId)
    await recordDelivery(null)
  } catch (error) {
    console.error(`Telegram notification failed for ${order.code}:`, error)
    await Promise.all([
      prisma.order.update({ where: { id: order.id }, data: { notificationFailed: true } }).catch((flagError) => {
        console.error(`Could not flag ${order.code} as notificationFailed:`, flagError)
      }),
      // The settings screen turns red when alerts stop reaching the owner.
      recordDelivery(error),
    ])
  }
}
