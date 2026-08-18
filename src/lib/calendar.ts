import { EventCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CalendarTone = "terracotta" | "mint" | "yellow" | "made";

export interface CalendarItem {
  type: "memory" | "journal" | "writing" | "event" | "birthday" | "project" | "goal";
  id: string;
  label: string;
  href: string;
  tone: CalendarTone;
  detail?: string;
}

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
}

export interface MonthCalendar {
  year: number;
  month: number;
  monthLabel: string;
  days: CalendarDay[];
}

const RECURRING_CATEGORIES = [EventCategory.BIRTHDAY, EventCategory.ANNIVERSARY];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Builds a fixed 6-week (42-day) grid for the given month, populated with
// two kinds of items: date-exact (memories, journal entries, writings,
// non-birthday events, project starts, goal deadlines — shown only in the
// year they actually happened) and recurring (Person.dob and
// BIRTHDAY/ANNIVERSARY events — matched by month/day against every day in
// the grid regardless of the record's origin year, same as a real calendar
// app treats birthdays).
export async function buildMonthCalendar(userId: string, year: number, month: number): Promise<MonthCalendar> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month - 1, 1 - startWeekday);
  const gridDays: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const gridEnd = gridDays[gridDays.length - 1];
  const rangeEnd = new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate() + 1);

  const byDate = new Map<string, CalendarItem[]>();
  function add(date: Date, item: CalendarItem) {
    const key = dateKey(date);
    const list = byDate.get(key);
    if (list) list.push(item);
    else byDate.set(key, [item]);
  }

  const [memories, journalEntries, writings, events, recurringEvents, people, projects, goals] =
    await Promise.all([
      prisma.memory.findMany({
        where: { userId, archivedAt: null, date: { gte: gridStart, lt: rangeEnd } },
        select: { id: true, title: true, date: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId, visibility: "PUBLIC", occurredAt: { gte: gridStart, lt: rangeEnd } },
        select: { id: true, title: true, occurredAt: true },
      }),
      prisma.writing.findMany({
        where: { userId, visibility: "PUBLIC", writtenAt: { gte: gridStart, lt: rangeEnd } },
        select: { id: true, title: true, type: true, writtenAt: true },
      }),
      prisma.event.findMany({
        where: {
          userId,
          archivedAt: null,
          date: { gte: gridStart, lt: rangeEnd },
          category: { notIn: RECURRING_CATEGORIES },
        },
        select: { id: true, title: true, date: true },
      }),
      prisma.event.findMany({
        where: { userId, archivedAt: null, date: { not: null }, category: { in: RECURRING_CATEGORIES } },
        select: { id: true, title: true, date: true, category: true },
      }),
      // Includes isSelf — unlike the dashboard's "Coming up" widget (which
      // is framed as reminders about other people), a full calendar should
      // show the owner's own birthday too. Locked people are excluded
      // entirely, same as everywhere else locked content is surfaced.
      prisma.person.findMany({
        where: { userId, archivedAt: null, isLocked: false, dob: { not: null } },
        select: { id: true, name: true, dob: true },
      }),
      prisma.project.findMany({
        where: { userId, archivedAt: null, startDate: { gte: gridStart, lt: rangeEnd } },
        select: { id: true, name: true, startDate: true },
      }),
      prisma.goal.findMany({
        where: { userId, targetDate: { gte: gridStart, lt: rangeEnd } },
        select: { id: true, title: true, targetDate: true },
      }),
    ]);

  for (const m of memories) {
    if (!m.date) continue;
    add(m.date, { type: "memory", id: m.id, label: m.title, href: `/memories/${m.id}`, tone: "yellow" });
  }
  for (const j of journalEntries) {
    add(j.occurredAt, {
      type: "journal",
      id: j.id,
      label: j.title ?? "Journal entry",
      href: `/journal/${j.id}`,
      tone: "yellow",
    });
  }
  for (const w of writings) {
    if (!w.writtenAt) continue;
    add(w.writtenAt, { type: "writing", id: w.id, label: w.title ?? w.type, href: "/writings", tone: "yellow" });
  }
  for (const e of events) {
    if (!e.date) continue;
    add(e.date, { type: "event", id: e.id, label: e.title, href: `/events/${e.id}`, tone: "terracotta" });
  }
  for (const p of projects) {
    if (!p.startDate) continue;
    add(p.startDate, {
      type: "project",
      id: p.id,
      label: p.name,
      href: `/projects/${p.id}`,
      tone: "made",
      detail: "Started",
    });
  }
  for (const g of goals) {
    if (!g.targetDate) continue;
    add(g.targetDate, { type: "goal", id: g.id, label: g.title, href: "/goals", tone: "made", detail: "Due" });
  }

  for (const d of gridDays) {
    for (const p of people) {
      if (!p.dob) continue;
      if (p.dob.getMonth() === d.getMonth() && p.dob.getDate() === d.getDate()) {
        add(d, {
          type: "birthday",
          id: `${p.id}-${dateKey(d)}`,
          label: `${p.name}'s birthday`,
          href: `/people/${p.id}`,
          tone: "mint",
          detail: `Turns ${d.getFullYear() - p.dob.getFullYear()}`,
        });
      }
    }
    for (const e of recurringEvents) {
      if (!e.date) continue;
      if (e.date.getMonth() === d.getMonth() && e.date.getDate() === d.getDate()) {
        add(d, {
          type: "event",
          id: `${e.id}-${dateKey(d)}`,
          label: e.title,
          href: `/events/${e.id}`,
          tone: "terracotta",
          detail: e.category === "BIRTHDAY" ? "Birthday" : "Anniversary",
        });
      }
    }
  }

  const today = new Date();
  const todayKey = dateKey(today);
  const days: CalendarDay[] = gridDays.map((d) => ({
    date: dateKey(d),
    day: d.getDate(),
    inMonth: d.getMonth() === month - 1,
    isToday: dateKey(d) === todayKey,
    items: byDate.get(dateKey(d)) ?? [],
  }));

  return {
    year,
    month,
    monthLabel: firstOfMonth.toLocaleString("en-US", { month: "long", year: "numeric" }),
    days,
  };
}
