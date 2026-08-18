import { requireSession } from "@/lib/require-session";
import { buildMonthCalendar } from "@/lib/calendar";
import { PageHeader } from "@/components/shell/PageHeader";
import { CalendarView } from "./CalendarView";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const now = new Date();
  const year = params.y ? Number(params.y) : now.getFullYear();
  const month = params.m ? Number(params.m) : now.getMonth() + 1;

  const calendar = await buildMonthCalendar(session.user.id, year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="ed-shell">
      <PageHeader
        eyebrow="Everything, on a date"
        title="Calendar"
        description="Memories, journal entries, events, projects, and birthdays — laid out on the month they happened, or happen every year."
      />
      <CalendarView
        calendar={calendar}
        prevHref={`/calendar?y=${prevYear}&m=${prevMonth}`}
        nextHref={`/calendar?y=${nextYear}&m=${nextMonth}`}
        todayHref="/calendar"
      />
    </div>
  );
}
