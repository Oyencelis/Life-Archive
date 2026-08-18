import { prisma } from "@/lib/prisma";

export interface MoodPoint {
  key: string;
  label: string;
  moods: Record<string, number>;
  total: number;
}

// Buckets Memory/JournalEntry moods by month over the trailing N months —
// aggregation happens in JS rather than a DB-side date_trunc, matching the
// same "fine at personal-archive scale" tradeoff as on-this-day.ts.
export async function getMoodTrend(userId: string, months = 6): Promise<MoodPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [memories, journal] = await Promise.all([
    prisma.memory.findMany({
      where: { userId, archivedAt: null, mood: { not: null }, date: { gte: since } },
      select: { date: true, mood: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId, visibility: "PUBLIC", mood: { not: null }, occurredAt: { gte: since } },
      select: { occurredAt: true, mood: true },
    }),
  ]);

  const buckets = new Map<string, Map<string, number>>();
  const keys: string[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
    buckets.set(key, new Map());
    cursor.setMonth(cursor.getMonth() + 1);
  }

  function record(date: Date | null, mood: string | null) {
    if (!date || !mood) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.set(mood, (bucket.get(mood) ?? 0) + 1);
  }

  for (const m of memories) record(m.date, m.mood);
  for (const j of journal) record(j.occurredAt, j.mood);

  return keys.map((key) => {
    const bucket = buckets.get(key)!;
    const moods = Object.fromEntries(bucket);
    const total = [...bucket.values()].reduce((a, b) => a + b, 0);
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", { month: "short" });
    return { key, label, moods, total };
  });
}
