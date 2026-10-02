/**
 * CHECKPOINT 2 — `pnpm telegram:test`
 *
 * Sends a test line and a sample order to TELEGRAM_CHAT_ID using TELEGRAM_BOT_TOKEN from .env.
 * `--dry-run` prints the sample order's HTML instead of sending anything.
 */
import { loadEnvConfig } from "@next/env"
import { addDays, todayIn } from "@/lib/dates"
import { defaultLocale, getDictionary } from "@/lib/i18n"
import { formatOrderMessage, notifyOwner } from "@/lib/telegram"
import { fill } from "@/lib/template"

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })

async function main() {
  const dict = await getDictionary(defaultLocale)
  const today = todayIn("Asia/Kolkata")

  const sample = formatOrderMessage(
    {
      code: "BK-1000",
      fulfilmentDate: addDays(today, 1),
      fulfilmentType: "PICKUP",
      customerName: "Priya M",
      customerPhone: "+919876543210",
      previousOrders: 4,
      autoVerified: false,
      isSuspected: false,
      items: [
        { name: "Sourdough loaf", quantity: 2, lineTotalPaise: 48000 },
        { name: "Brownie box", quantity: 1, lineTotalPaise: 32000 },
      ],
      totalPaise: 80000,
      customerNote: "no walnuts — <3 & thanks",
      pendingCount: 6,
      maxOrders: 10,
      today,
      url: "http://localhost:3000/admin/orders/sample",
    },
    dict.telegram,
  )

  if (process.argv.includes("--dry-run")) {
    console.log(sample)
    return
  }

  await notifyOwner(fill(dict.telegram.test, { bakery: dict.meta.home.title }))
  await notifyOwner(sample)
  console.log("Sent two messages — check Telegram.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
