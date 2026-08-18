"use server";

import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  title: string;
  meta?: string;
  href: string;
}

export interface SearchResultGroup {
  label: string;
  results: SearchResult[];
}

export async function searchArchive(query: string): Promise<SearchResultGroup[]> {
  const session = await requireSession();
  const q = query.trim();
  if (q.length === 0) return [];

  const userId = session.user.id;
  const term = { contains: q, mode: "insensitive" as const };

  const [people, memories, journal, places, events, projects, writings] = await Promise.all([
    prisma.person.findMany({
      where: { userId, archivedAt: null, isLocked: false, OR: [{ name: term }, { nickname: term }, { bio: term }] },
      select: { id: true, name: true, category: true },
      take: 6,
    }),
    prisma.memory.findMany({
      where: { userId, archivedAt: null, OR: [{ title: term }, { description: term }] },
      select: { id: true, title: true, date: true },
      take: 6,
    }),
    prisma.journalEntry.findMany({
      where: { userId, visibility: "PUBLIC", OR: [{ title: term }, { content: term }] },
      select: { id: true, title: true, occurredAt: true },
      take: 6,
    }),
    prisma.place.findMany({
      where: { userId, archivedAt: null, OR: [{ name: term }, { description: term }] },
      select: { id: true, name: true, category: true },
      take: 6,
    }),
    prisma.event.findMany({
      where: { userId, archivedAt: null, OR: [{ title: term }, { description: term }] },
      select: { id: true, title: true, date: true },
      take: 6,
    }),
    prisma.project.findMany({
      where: { userId, archivedAt: null, OR: [{ name: term }, { description: term }] },
      select: { id: true, name: true, status: true },
      take: 6,
    }),
    prisma.writing.findMany({
      where: { userId, visibility: "PUBLIC", OR: [{ title: term }, { content: term }] },
      select: { id: true, title: true, type: true },
      take: 6,
    }),
  ]);

  const groups: SearchResultGroup[] = [
    {
      label: "People",
      results: people.map((p) => ({ id: p.id, title: p.name, meta: p.category, href: `/people/${p.id}` })),
    },
    {
      label: "Memories",
      results: memories.map((m) => ({
        id: m.id,
        title: m.title,
        meta: m.date?.toISOString().slice(0, 10),
        href: `/memories/${m.id}`,
      })),
    },
    {
      label: "Journal",
      results: journal.map((j) => ({
        id: j.id,
        title: j.title ?? j.occurredAt.toISOString().slice(0, 10),
        meta: j.occurredAt.toISOString().slice(0, 10),
        href: `/journal/${j.id}`,
      })),
    },
    {
      label: "Places",
      results: places.map((p) => ({
        id: p.id,
        title: p.name,
        meta: p.category ?? undefined,
        href: `/places/${p.id}`,
      })),
    },
    {
      label: "Events",
      results: events.map((e) => ({
        id: e.id,
        title: e.title,
        meta: e.date?.toISOString().slice(0, 10),
        href: `/events/${e.id}`,
      })),
    },
    {
      label: "Projects",
      results: projects.map((p) => ({ id: p.id, title: p.name, meta: p.status, href: `/projects/${p.id}` })),
    },
    {
      label: "Writings",
      results: writings.map((w) => ({ id: w.id, title: w.title ?? w.type, meta: w.type, href: `/writings` })),
    },
  ];

  return groups.filter((g) => g.results.length > 0);
}
