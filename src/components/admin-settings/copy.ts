import { cutoffLabel, formatClock } from "@/lib/calendar/cutoffs"
import { type IsoDate, weekday } from "@/lib/dates"
import { formatPaise } from "@/lib/money"
import { type OpeningHours, WEEK, weekdayKey } from "@/lib/settings/hours"
import type { SettingsPageData } from "@/lib/settings/queries"
import type { SettingsSection } from "@/lib/settings/sections"
import { fill } from "@/lib/template"
import type { AdminCopy, SettingsCopy } from "./types"

/** Dict strings for the settings screen, filled. */

/** "Fix 2 problems to save" or "3 unsaved changes" — what the save bar says. */
export function saveText(problems: number, changes: number, dict: SettingsCopy["save"]): string {
  if (problems > 0) return problems === 1 ? dict.problemsOne : fill(dict.problems, { count: problems })
  return changes === 1 ? dict.unsavedOne : fill(dict.unsaved, { count: changes })
}

/** A field's error line — the message keys come from src/lib/settings/form.ts. */
export function errorText(key: string | undefined, dict: SettingsCopy["errors"], values: Record<string, string | number> = {}): string | undefined {
  if (!key) return undefined
  return fill(dict[key as keyof SettingsCopy["errors"]], values)
}

/** "the same day", "the day before", "3 days before". */
export function cutoffDayText(days: number, dict: SettingsCopy["ordering"]): string {
  if (days === 0) return dict.cutoffSameDay
  if (days === 1) return dict.cutoffDayBefore
  return fill(dict.cutoffDaysBefore, { count: days })
}

/** "Customers can order for a Saturday until 6pm on the Friday before." */
export function cutoffHintText(time: string, days: number, dict: SettingsCopy): string {
  const values = { time: formatClock(time), count: days }
  if (days === 0) return fill(dict.ordering.cutoffHintSameDay, values)
  if (days >= 7) return fill(dict.ordering.cutoffHintWeek, values)
  // Saturday is index 5 in the Monday-first week.
  return fill(dict.ordering.cutoffHint, { ...values, day: dict.bakery.days[WEEK[5 - days]] })
}

/** "Open today 8am–8pm" / "Closed today", for the landing preview's contact line. */
export function todayHoursText(hours: OpeningHours, today: IsoDate, dict: SettingsCopy["preview"]): string {
  const day = hours[weekdayKey(weekday(today))]
  return day.open ? fill(dict.openToday, { from: formatClock(day.from), to: formatClock(day.to) }) : dict.closedToday
}

/** "Pickup · Delivery within 3 km, ₹40" — how customers can get their order. */
export function fulfilmentText(pickup: boolean, delivery: boolean, km: number, feeRupees: number, dict: SettingsCopy["preview"]): string {
  const ways = pickup ? [dict.pickup] : []
  if (delivery) ways.push(feeRupees > 0 ? fill(dict.delivery, { km, fee: formatPaise(feeRupees * 100) }) : fill(dict.deliveryFree, { km }))
  return ways.join(" · ")
}

export type Banner = { text: string; tone: "paused" | "note" }

/** The strip across the top of the landing page: the pause message while paused, else the announcement if it's on. */
export function landingBanner(pause: SettingsPageData["pause"], announcementOn: boolean, announcement: string, dict: SettingsCopy): Banner | null {
  if (pause.paused) return { text: fill(dict.pause.previewPaused, { reason: pause.reason }), tone: "paused" }
  return announcementOn && announcement.trim() ? { text: announcement.trim(), tone: "note" } : null
}

export type Summary = { text: string; alert: boolean }

/** The line under each section in the phone's list — its saved state at a glance. Red when something needs the owner. */
export function sectionSummary(section: SettingsSection, data: SettingsPageData, dict: AdminCopy): Summary {
  const s = dict.settings.summaries
  switch (section) {
    case "bakery": {
      const name = data.bakery.bakeryName
      if (!data.hoursSet) return { text: fill(s.bakeryNoHours, { name }), alert: false }
      const open = WEEK.filter((day) => data.bakery.hours[day].open).length
      return { text: open === 1 ? fill(s.bakeryDaysOne, { name }) : fill(s.bakeryDays, { name, count: open }), alert: false }
    }
    case "ordering": {
      if (data.pause.paused) return { text: s.paused, alert: true }
      const cutoff = cutoffLabel({ time: data.ordering.cutoffTime, daysBefore: data.ordering.cutoffDays }, dict.cutoffs, "long")
      return { text: fill(s.ordering, { cutoff, max: data.ordering.maxOrders }), alert: false }
    }
    case "notifications":
      return { text: s.telegram[data.telegram.kind], alert: data.telegram.kind === "failed" }
    case "staff": {
      const owners = data.staff.filter((person) => person.role === "OWNER").length
      const people = data.staff.length === 1 ? s.peopleOne : fill(s.people, { count: data.staff.length })
      return { text: fill(s.staff, { people, owners: owners === 1 ? s.ownersOne : fill(s.owners, { count: owners }) }), alert: false }
    }
    case "appearance":
      return { text: data.appearance.announcementOn ? s.announcement : s.noAnnouncement, alert: false }
  }
}
