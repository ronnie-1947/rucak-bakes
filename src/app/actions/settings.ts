"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOwner } from "@/auth"
import { isOurPublicId } from "@/lib/cloudinary"
import { deleteFromCloudinary } from "@/lib/cloudinary-server"
import { formatTimeIn, todayIn } from "@/lib/dates"
import { defaultLocale, getDictionary } from "@/lib/i18n"
import { normalise } from "@/lib/phone"
import {
  DELIVERY_FEE,
  DELIVERY_RADIUS,
  MAX_ORDERS,
  ORDER_AHEAD,
  OVERBOOK_MAX,
  phoneDigits,
  SETTINGS_LIMITS as L,
} from "@/lib/settings/form"
import { hoursProblem, openingHoursSchema, WEEK } from "@/lib/settings/hours"
import { getSettings } from "@/lib/settings/row"
import { SETTINGS_PATH } from "@/lib/settings/sections"
import { acceptedCodes, recordDelivery } from "@/lib/settings/telegram"
import {
  addStaff,
  type AddStaffOutcome,
  connectChat,
  disconnectChat,
  removeStaff,
  type RemoveStaffOutcome,
  saveAppearance as writeAppearance,
  saveBakery as writeBakery,
  saveOrdering as writeOrdering,
  setAutoVerify,
  setHeroImage,
  setPaused,
} from "@/lib/settings/writes"
import { botConfigured, findChatWithCode, notifyOwner } from "@/lib/telegram"
import { fill } from "@/lib/template"

/**
 * The settings screen's server actions — owners only (requireOwner runs requireStaff first). Every input is
 * re-validated here whatever the browser checked. Bakery details, ordering rules, the pause and the
 * banner show on customer pages, so those revalidate the whole app; Telegram and staff only this screen.
 */

type Refused = { ok: false; reason: "INVALID" | "FORBIDDEN" }
const invalid: Refused = { ok: false, reason: "INVALID" }
const forbidden: Refused = { ok: false, reason: "FORBIDDEN" }

export type SaveResult = { ok: true } | Refused

function refreshEverywhere() {
  revalidatePath("/", "layout")
}

function refreshScreen() {
  revalidatePath(SETTINGS_PATH)
}

// ── Sections that save as a form ────────────────────────────────────────────

const bakeryInput = z.object({
  bakeryName: z.string().trim().min(1).max(L.bakeryName),
  tagline: z.string().trim().max(L.tagline),
  phone: z.string().trim().max(20),
  pickupAddress: z.string().trim().max(L.pickupAddress),
  hours: openingHoursSchema.refine((hours) => !WEEK.some((day) => hoursProblem(hours[day]))),
})

export async function saveBakeryDetails(input: z.input<typeof bakeryInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = bakeryInput.safeParse(input)
  if (!parsed.success) return invalid
  const { bakeryName, tagline, phone, pickupAddress, hours } = parsed.data
  const publicPhone = phone ? normalise(`+91${phoneDigits(phone)}`) : null
  if (phone && !publicPhone) return invalid
  await writeBakery({ bakeryName, tagline: tagline || null, publicPhone, pickupAddress: pickupAddress || null, openingHours: hours })
  refreshEverywhere()
  return { ok: true }
}

const orderingInput = z
  .object({
    maxOrders: z.number().int().min(MAX_ORDERS.min).max(MAX_ORDERS.max),
    overbookLimit: z.number().int().max(OVERBOOK_MAX),
    cutoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    cutoffDays: z.number().int().min(0).max(7),
    orderAheadDays: z.number().int().min(ORDER_AHEAD.min).max(ORDER_AHEAD.max),
    pickup: z.boolean(),
    delivery: z.boolean(),
    radiusKm: z.number().int().min(DELIVERY_RADIUS.min).max(DELIVERY_RADIUS.max),
    feeRupees: z.number().int().min(DELIVERY_FEE.min).max(DELIVERY_FEE.max),
  })
  // The database insists on both (md_capacity_valid on days, s_fulfilment_enabled here).
  .refine((values) => values.overbookLimit >= values.maxOrders && (values.pickup || values.delivery))

export async function saveOrderingRules(input: z.input<typeof orderingInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = orderingInput.safeParse(input)
  if (!parsed.success) return invalid
  const values = parsed.data
  await writeOrdering({
    defaultMaxOrders: values.maxOrders,
    defaultOverbook: values.overbookLimit,
    defaultCutoffTime: values.cutoffTime,
    defaultCutoffDays: values.cutoffDays,
    orderAheadDays: values.orderAheadDays,
    pickupEnabled: values.pickup,
    deliveryEnabled: values.delivery,
    deliveryRadiusKm: values.radiusKm,
    deliveryFeePaise: values.feeRupees * 100,
  })
  refreshEverywhere()
  return { ok: true }
}

const appearanceInput = z
  .object({
    announcementOn: z.boolean(),
    announcement: z.string().trim().max(L.announcement),
  })
  .refine((values) => !values.announcementOn || values.announcement.length > 0)

export async function saveAppearanceSettings(input: z.input<typeof appearanceInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = appearanceInput.safeParse(input)
  if (!parsed.success) return invalid
  const { announcementOn, announcement } = parsed.data
  await writeAppearance({ announcement: announcementOn ? announcement : null })
  refreshEverywhere()
  return { ok: true }
}

// ── Immediate-effect switches ───────────────────────────────────────────────

const heroImageInput = z.object({ heroImage: z.string().refine(isOurPublicId).nullable() })

/**
 * The landing photo saves as soon as it's uploaded (or removed) — no Save press, so it can't be lost by leaving
 * the screen. The browser has already done step 1, the upload; this is steps 2 and 3.
 */
export async function saveHeroImage(input: z.input<typeof heroImageInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = heroImageInput.safeParse(input)
  if (!parsed.success) return invalid
  // 2. Save the new photo, getting back the one it replaces.
  const previous = await setHeroImage(parsed.data.heroImage)
  // 3. Delete the previous photo from Cloudinary — only now, so the landing page never points at a deleted image.
  //    A Cloudinary hiccup only leaves a file behind; it never fails the save.
  if (previous) await deleteFromCloudinary(previous).catch((error: unknown) => console.error(`Could not delete the old hero ${previous}:`, error))
  refreshEverywhere()
  return { ok: true }
}

const autoVerifyInput = z.object({ on: z.boolean() })

export async function setAutoVerifyTrusted(input: z.input<typeof autoVerifyInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = autoVerifyInput.safeParse(input)
  if (!parsed.success) return invalid
  await setAutoVerify(parsed.data.on)
  // The customer screens word their trust confirms by this setting.
  revalidatePath("/admin", "layout")
  return { ok: true }
}

const pauseInput = z.discriminatedUnion("paused", [
  z.object({ paused: z.literal(true), reason: z.string().trim().min(1).max(L.pauseReason) }),
  z.object({ paused: z.literal(false) }),
])

/** Pause all ordering (after the confirm, with the reason customers will see) or resume it. */
export async function setOrderingPaused(input: z.input<typeof pauseInput>): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  const parsed = pauseInput.safeParse(input)
  if (!parsed.success) return invalid
  if (parsed.data.paused) await setPaused(true, parsed.data.reason)
  else await setPaused(false)
  refreshEverywhere()
  return { ok: true }
}

// ── Telegram ────────────────────────────────────────────────────────────────

export type ConnectResult = { ok: true } | Refused | { ok: false; reason: "NOT_SET_UP" | "NOT_FOUND" | "UNREACHABLE" }

/**
 * "Connect Telegram": looks through the bot's recent messages for today's code and stores the chat that
 * sent it, then says hello there — which also proves messages get through.
 */
export async function connectTelegram(): Promise<ConnectResult> {
  if (!(await requireOwner())) return forbidden
  if (!botConfigured()) return { ok: false, reason: "NOT_SET_UP" }
  const settings = await getSettings()
  let chatId: string | null
  try {
    chatId = await findChatWithCode(acceptedCodes(todayIn(settings.timezone)))
  } catch (error) {
    console.error("Telegram getUpdates failed:", error)
    return { ok: false, reason: "UNREACHABLE" }
  }
  if (!chatId) return { ok: false, reason: "NOT_FOUND" }

  await connectChat(chatId)
  const dict = await getDictionary(defaultLocale)
  try {
    await notifyOwner(fill(dict.telegram.connected, { bakery: settings.bakeryName }), chatId)
    await recordDelivery(null)
  } catch (error) {
    await recordDelivery(error)
  }
  refreshScreen()
  return { ok: true }
}

export type TestResult = { ok: true; at: string } | Refused | { ok: false; reason: "NOT_CONNECTED" | "FAILED" }

/** "Send test message" — the result is recorded, so a failure turns the card red and a success clears it. */
export async function sendTelegramTest(): Promise<TestResult> {
  if (!(await requireOwner())) return forbidden
  const settings = await getSettings()
  if (!settings.telegramChatId) return { ok: false, reason: "NOT_CONNECTED" }
  const dict = await getDictionary(defaultLocale)
  try {
    await notifyOwner(fill(dict.telegram.test, { bakery: settings.bakeryName }), settings.telegramChatId)
    await recordDelivery(null)
    refreshScreen()
    return { ok: true, at: formatTimeIn(new Date(), settings.timezone) }
  } catch (error) {
    await recordDelivery(error)
    refreshScreen()
    return { ok: false, reason: "FAILED" }
  }
}

export async function disconnectTelegram(): Promise<SaveResult> {
  if (!(await requireOwner())) return forbidden
  await disconnectChat()
  refreshScreen()
  return { ok: true }
}

// ── Staff ───────────────────────────────────────────────────────────────────

const staffInput = z.object({
  name: z.string().trim().min(1).max(L.staffName),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["OWNER", "STAFF"]),
})

export async function addStaffMember(input: z.input<typeof staffInput>): Promise<AddStaffOutcome | Refused> {
  if (!(await requireOwner())) return forbidden
  const parsed = staffInput.safeParse(input)
  if (!parsed.success) return invalid
  const result = await addStaff(parsed.data.name, parsed.data.email, parsed.data.role)
  if (result.ok) refreshScreen()
  return result
}

const removeInput = z.object({ id: z.string().min(1).max(40) })

export async function removeStaffMember(input: z.input<typeof removeInput>): Promise<RemoveStaffOutcome | Refused> {
  const owner = await requireOwner()
  if (!owner) return forbidden
  const parsed = removeInput.safeParse(input)
  if (!parsed.success) return invalid
  const result = await removeStaff(parsed.data.id, owner.id)
  if (result.ok) refreshScreen()
  return result
}
