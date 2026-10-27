import { authBypassed } from "@/auth"
import type { ShellData } from "@/components/admin-shell/types"
import { OrderStatus } from "@/generated/prisma/enums"
import { formatDayLabel, todayIn, toDbDate } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { getSettings } from "@/lib/settings/row"

/** Everything the admin frame shows but who is signed in, read once per request in the layout — alongside requireStaff(), not after it. */
export async function loadShellData(): Promise<Omit<ShellData, "staffName">> {
  const settings = await getSettings()
  const today = todayIn(settings.timezone)
  const pendingCount = await prisma.order.count({ where: { status: OrderStatus.PENDING, fulfilmentDate: { gte: toDbDate(today) } } })
  return { bakeryName: settings.bakeryName, todayLabel: formatDayLabel(today), pendingCount, bypassed: authBypassed }
}
