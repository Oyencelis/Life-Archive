import { prisma } from "@/lib/prisma";

export interface OnThisDayItem {
  type: "memory" | "event" | "journal";
  id: string;
  label: string;
  href: string;
  yearsAgo: number;
  snippet: string;
}

function snippet(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// Scans every dated record in JS rather than a DB-side EXTRACT(month/day)
// query — fine at personal-archive scale, and keeps this portable across
// whatever Postgres provider ends up hosting it.
export async function getOnThisDay(userId: string, now = new Date()): Promise<OnThisDayItem[]> {
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const currentYear = now.getUTCFullYear();

  const [memories, events, journal] = await Promise.all([
    prisma.memory.findMany({
      where: { userId, archivedAt: null, date: { not: null } },
      select: { id: true, title: true, date: true, description: true },
    }),
    prisma.event.findMany({
      where: { userId, archivedAt: null, date: { not: null } },
      select: { id: true, title: true, date: true, description: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId, visibility: "PUBLIC" },
      select: { id: true, title: true, occurredAt: true, content: true },
    }),
  ]);

  const items: OnThisDayItem[] = [];

  for (const m of memories) {
    if (m.date && m.date.getUTCMonth() === month && m.date.getUTCDate() === day && m.date.getUTCFullYear() !== currentYear) {
      items.push({
        type: "memory",
        id: m.id,
        label: m.title,
        href: `/memories/${m.id}`,
        yearsAgo: currentYear - m.date.getUTCFullYear(),
        snippet: snippet(m.description),
      });
    }
  }
  for (const e of events) {
    if (e.date && e.date.getUTCMonth() === month && e.date.getUTCDate() === day && e.date.getUTCFullYear() !== currentYear) {
      items.push({
        type: "event",
        id: e.id,
        label: e.title,
        href: `/events/${e.id}`,
        yearsAgo: currentYear - e.date.getUTCFullYear(),
        snippet: snippet(e.description),
      });
    }
  }
  for (const j of journal) {
    if (
      j.occurredAt.getUTCMonth() === month &&
      j.occurredAt.getUTCDate() === day &&
      j.occurredAt.getUTCFullYear() !== currentYear
    ) {
      items.push({
        type: "journal",
        id: j.id,
        label: j.title ?? "Journal entry",
        href: `/journal/${j.id}`,
        yearsAgo: currentYear - j.occurredAt.getUTCFullYear(),
        snippet: snippet(j.content),
      });
    }
  }

  return items.sort((a, b) => a.yearsAgo - b.yearsAgo);
}
