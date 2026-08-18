"use server";

import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export interface SurpriseResult {
  type: string;
  label: string;
  snippet: string;
  href: string;
}

function snippet(text: string | null | undefined, max = 180): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

const POOLS = [
  "memory",
  "person",
  "journal",
  "place",
  "project",
  "goal",
  "writing",
] as const;

export async function getSurprise(): Promise<SurpriseResult | { error: string }> {
  const session = await requireSession();
  const userId = session.user.id;

  const counts = await Promise.all([
    prisma.memory.count({ where: { userId, archivedAt: null } }),
    prisma.person.count({ where: { userId, archivedAt: null, isLocked: false } }),
    prisma.journalEntry.count({ where: { userId, visibility: "PUBLIC" } }),
    prisma.place.count({ where: { userId, archivedAt: null } }),
    prisma.project.count({ where: { userId, archivedAt: null } }),
    prisma.goal.count({ where: { userId } }),
    prisma.writing.count({ where: { userId, visibility: "PUBLIC" } }),
  ]);

  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { error: "Nothing archived yet — add something first." };
  }

  // Uniform sample across the union of every pool, weighted by pool size.
  let roll = Math.floor(Math.random() * total);
  let chosen: (typeof POOLS)[number] = POOLS[0];
  let offset = 0;
  for (let i = 0; i < POOLS.length; i++) {
    if (roll < counts[i]) {
      chosen = POOLS[i];
      offset = roll;
      break;
    }
    roll -= counts[i];
  }

  switch (chosen) {
    case "memory": {
      const [m] = await prisma.memory.findMany({
        where: { userId, archivedAt: null },
        skip: offset,
        take: 1,
      });
      return { type: "memory", label: m.title, snippet: snippet(m.description), href: `/memories/${m.id}` };
    }
    case "person": {
      const [p] = await prisma.person.findMany({
        where: { userId, archivedAt: null, isLocked: false },
        skip: offset,
        take: 1,
      });
      return { type: "person", label: p.name, snippet: snippet(p.bio) || p.category, href: `/people/${p.id}` };
    }
    case "journal": {
      const [j] = await prisma.journalEntry.findMany({
        where: { userId, visibility: "PUBLIC" },
        skip: offset,
        take: 1,
      });
      return {
        type: "journal entry",
        label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
        snippet: snippet(j.content),
        href: `/journal/${j.id}`,
      };
    }
    case "place": {
      const [pl] = await prisma.place.findMany({
        where: { userId, archivedAt: null },
        skip: offset,
        take: 1,
      });
      return { type: "place", label: pl.name, snippet: snippet(pl.description), href: `/places/${pl.id}` };
    }
    case "project": {
      const [pr] = await prisma.project.findMany({
        where: { userId, archivedAt: null },
        skip: offset,
        take: 1,
      });
      return {
        type: "project",
        label: pr.name,
        snippet: snippet(pr.description) || snippet(pr.whatILearned),
        href: `/projects/${pr.id}`,
      };
    }
    case "goal": {
      const [g] = await prisma.goal.findMany({ where: { userId }, skip: offset, take: 1 });
      return { type: "goal", label: g.title, snippet: snippet(g.description) || g.status, href: "/goals" };
    }
    case "writing": {
      const [w] = await prisma.writing.findMany({
        where: { userId, visibility: "PUBLIC" },
        skip: offset,
        take: 1,
      });
      return { type: "writing", label: w.title ?? w.type, snippet: snippet(w.content), href: "/writings" };
    }
  }
}
