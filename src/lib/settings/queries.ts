import { getStaff } from "@/auth"
import type { StaffRole } from "@/generated/prisma/client"
import { formatDayLabel, isoDateInZone, type IsoDate, todayIn } from "@/lib/dates"
import { prisma } from "@/lib/db"
import { type AppearanceValues, type BakeryValues, DELIVERY_RADIUS, type OrderingValues, phoneField } from "./form"
import { DEFAULT_HOURS, parseOpeningHours } from "./hours"
import { getSettings } from "./row"
import { FIRST_SECTION, parseSection, type SettingsSection } from "./sections"
import { type TelegramState, telegramState } from "./telegram"

/** The settings screen's read model: every section's saved values, so the list can summarise them all. */

export type StaffMember = {
  id: string
  name: string
  email: string
  role: StaffRole
  isYou: boolean
  /** "Sat 3 Oct" — the last Google sign-in. Null if they never have. */
  lastSignIn: string | null
  /** Not yourself, and never the last owner. */
  canRemove: boolean
}

export type SettingsPageData = {
  /** From `?section=` — null shows the list on phones. */
  section: SettingsSection | null
  /** What the content pane shows: the named section, else Bakery details (beside the list from 768px). */
  active: SettingsSection
  /** Owners change settings; staff read them. */
  canEdit: boolean
  today: IsoDate
  timezone: string
  bakery: BakeryValues
  /** False until opening hours are first saved — customers see none until then. */
  hoursSet: boolean
  ordering: OrderingValues
  autoVerifyTrusted: boolean
  pause: { paused: boolean; reason: string }
  appearance: AppearanceValues
  telegram: TelegramState
  staff: StaffMember[]
}

export async function loadSettingsPage(searchParams: Record<string, string | string[] | undefined>): Promise<SettingsPageData> {
  const [settings, me, people] = await Promise.all([
    getSettings(),
    getStaff(),
    prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ])
  const timezone = settings.timezone
  const today = todayIn(timezone)
  const canEdit = me?.role === "OWNER"
  const section = parseSection(searchParams.section)
  const active = section ?? FIRST_SECTION
  const hours = parseOpeningHours(settings.openingHours)
  const owners = people.filter((person) => person.role === "OWNER").length

  return {
    section,
    active,
    canEdit,
    today,
    timezone,
    bakery: {
      bakeryName: settings.bakeryName,
      tagline: settings.tagline ?? "",
      phone: phoneField(settings.publicPhone),
      pickupAddress: settings.pickupAddress ?? "",
      hours: hours ?? DEFAULT_HOURS,
    },
    hoursSet: hours !== null,
    ordering: {
      maxOrders: settings.defaultMaxOrders,
      overbookLimit: Math.max(settings.defaultOverbook, settings.defaultMaxOrders),
      cutoffTime: settings.defaultCutoffTime,
      cutoffDays: settings.defaultCutoffDays,
      orderAheadDays: settings.orderAheadDays,
      pickup: settings.pickupEnabled,
      delivery: settings.deliveryEnabled,
      radiusKm: settings.deliveryRadiusKm ?? DELIVERY_RADIUS.start,
      feeRupees: Math.round(settings.deliveryFeePaise / 100),
    },
    autoVerifyTrusted: settings.autoVerifyTrusted,
    pause: { paused: settings.orderingPaused, reason: settings.orderingPausedReason ?? "" },
    appearance: {
      heroImage: settings.heroImage,
      announcementOn: Boolean(settings.announcement?.trim()),
      announcement: settings.announcement ?? "",
    },
    // Only the Notifications pane shows the connect steps — and only an owner gets today's code.
    telegram: await telegramState(settings, timezone, today, canEdit && active === "notifications"),
    staff: people.map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      isYou: person.id === me?.id,
      lastSignIn: person.lastLoginAt ? formatDayLabel(isoDateInZone(person.lastLoginAt, timezone)) : null,
      canRemove: person.id !== me?.id && !(person.role === "OWNER" && owners <= 1),
    })),
  }
}
