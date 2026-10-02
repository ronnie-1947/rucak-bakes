import { Container } from "@/components/ui/Container"
import type { WeekPlan } from "@/lib/calendar/week"
import type { AdminCopy } from "./types"
import { WeekNav } from "./WeekNav"
import { WeekPlanner } from "./WeekPlanner"

type AdminCalendarProps = {
  dict: AdminCopy
  week: WeekPlan
}

/**
 * /admin/calendar — the week planner. Seven day cards: one column on phones, two on the 820px kitchen
 * tablet (the main planning device), seven from 1280px. Each day is edited in full at /admin/calendar/[date].
 */
export function AdminCalendar({ dict, week }: AdminCalendarProps) {
  return (
    <Container className="pt-6 pb-12">
      <WeekPlanner key={week.monday} week={week} nav={<WeekNav week={week} dict={dict.calendar} />} dict={dict} />
    </Container>
  )
}
