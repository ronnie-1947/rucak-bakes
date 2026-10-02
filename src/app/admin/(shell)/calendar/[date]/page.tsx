import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AdminCalendarDay } from "@/components/admin-calendar-day/AdminCalendarDay"
import { loadDayEditor } from "@/lib/calendar/day"
import { formatLongDayLabel, isIsoDate } from "@/lib/dates"
import { getDictionary, type Locale } from "@/lib/i18n"
import { fill } from "@/lib/template"

const locale: Locale = "en"

export async function generateMetadata({ params }: PageProps<"/admin/calendar/[date]">): Promise<Metadata> {
  const [{ date }, dict] = await Promise.all([params, getDictionary(locale)])
  if (!isIsoDate(date)) return { title: dict.admin.calendar.metaTitle }
  return { title: fill(dict.admin.calendarDay.metaTitle, { day: formatLongDayLabel(date) }) }
}

export default async function CalendarDayPage({ params }: PageProps<"/admin/calendar/[date]">) {
  const { date } = await params
  if (!isIsoDate(date)) notFound()
  const [dict, data] = await Promise.all([getDictionary(locale), loadDayEditor(date)])
  if (!data) notFound()
  return <AdminCalendarDay dict={dict.admin} data={data} />
}
