import { prisma } from "@/lib/prisma";

export interface UpcomingItem {
  type: "birthday" | "anniversary";
  id: string;
  label: string;
  href: string;
  daysAway: number;
  turningAge: number | null;
}

function nextOccurrence(todayMidnight: Date, month: number, day: number): Date {
  let next = new Date(todayMidnight.getFullYear(), month, day);
  if (next < todayMidnight) next = new Date(todayMidnight.getFullYear() + 1, month, day);
  return next;
}

// Person.dob and Event (BIRTHDAY/ANNIVERSARY category) dates falling within
// the next `withinDays`, regardless of year — the forward-looking
// counterpart to on-this-day.ts's backward month/day matching.
export async function getUpcoming(
  userId: string,
  withinDays = 30,
  now = new Date()
): Promise<UpcomingItem[]> {
  const [people, events] = await Promise.all([
    prisma.person.findMany({
      where: { userId, archivedAt: null, dob: { not: null }, isSelf: false, isLocked: false },
      select: { id: true, name: true, dob: true },
    }),
    prisma.event.findMany({
      where: {
        userId,
        archivedAt: null,
        date: { not: null },
        category: { in: ["BIRTHDAY", "ANNIVERSARY"] },
      },
      select: { id: true, title: true, date: true, category: true },
    }),
  ]);

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items: UpcomingItem[] = [];

  for (const p of people) {
    if (!p.dob) continue;
    const next = nextOccurrence(todayMidnight, p.dob.getUTCMonth(), p.dob.getUTCDate());
    const daysAway = Math.round((next.getTime() - todayMidnight.getTime()) / 86_400_000);
    if (daysAway > withinDays) continue;
    items.push({
      type: "birthday",
      id: p.id,
      label: p.name,
      href: `/people/${p.id}`,
      daysAway,
      turningAge: next.getFullYear() - p.dob.getUTCFullYear(),
    });
  }

  for (const e of events) {
    if (!e.date) continue;
    const next = nextOccurrence(todayMidnight, e.date.getUTCMonth(), e.date.getUTCDate());
    const daysAway = Math.round((next.getTime() - todayMidnight.getTime()) / 86_400_000);
    if (daysAway > withinDays) continue;
    items.push({
      type: e.category === "BIRTHDAY" ? "birthday" : "anniversary",
      id: e.id,
      label: e.title,
      href: `/events/${e.id}`,
      daysAway,
      turningAge: null,
    });
  }

  return items.sort((a, b) => a.daysAway - b.daysAway);
}
