import type { Metadata } from "next"
import { AdminCalendar } from "@/components/admin-calendar/AdminCalendar"
import { parseWeek } from "@/lib/calendar/routes"
import { loadWeek } from "@/lib/calendar/week"
import { todayIn } from "@/lib/dates"
import { getDictionary, type Locale } from "@/lib/i18n"
import { getSettings } from "@/lib/settings"

const locale: Locale = "en"

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(locale)
  return { title: dict.admin.calendar.metaTitle }
}

export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  const [query, settings] = await Promise.all([searchParams, getSettings()])
  const monday = parseWeek(query.week, todayIn(settings.timezone))
  const [dict, week] = await Promise.all([getDictionary(locale), loadWeek(monday)])

  return <AdminCalendar dict={dict.admin} week={week} />
}
