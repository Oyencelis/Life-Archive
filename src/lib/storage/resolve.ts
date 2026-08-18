import { prisma } from "@/lib/prisma";
import { getSignedMediaUrl, getSignedMediaUrls } from "@/lib/storage/media";
import type { MediaType } from "@prisma/client";

export interface ResolvedMedia {
  id: string;
  url: string;
  type: MediaType;
}

export async function resolveMediaById(mediaId: string | null | undefined): Promise<ResolvedMedia | null> {
  if (!mediaId) return null;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return null;
  const url = await getSignedMediaUrl(media.storageKey);
  if (!url) return null;
  return { id: media.id, url, type: media.type };
}

// Batched version of resolveMediaById — for a list of people resolving
// their own avatarMediaId each, one query + one signed-url batch instead
// of N of each. Missing/null ids are simply absent from the result map.
export async function resolveMediaByIds(
  mediaIds: (string | null | undefined)[]
): Promise<Map<string, ResolvedMedia>> {
  const ids = Array.from(new Set(mediaIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return new Map();

  const media = await prisma.media.findMany({ where: { id: { in: ids } } });
  if (media.length === 0) return new Map();

  const urls = await getSignedMediaUrls(media.map((m) => m.storageKey));

  const result = new Map<string, ResolvedMedia>();
  for (const m of media) {
    const url = urls.get(m.storageKey);
    if (url) result.set(m.id, { id: m.id, url, type: m.type });
  }
  return result;
}

export async function resolveEntityMedia(
  entityType: string,
  entityId: string,
  role: "cover" | "gallery" | "attachment"
): Promise<ResolvedMedia[]> {
  const links = await prisma.mediaLink.findMany({
    where: { entityType, entityId, role },
    include: { media: true },
    orderBy: { createdAt: "asc" },
  });

  const urls = await getSignedMediaUrls(links.map((l) => l.media.storageKey));
  const resolved = links.map((link) => {
    const url = urls.get(link.media.storageKey);
    return url ? { id: link.media.id, url, type: link.media.type } : null;
  });

  return resolved.filter((m): m is ResolvedMedia => m !== null);
}

// List-page version of resolveEntityMedia — one entity, one role, but for
// MANY entities at once. A list of 30 events resolving their own cover
// each via resolveEntityMedia means 30 findMany calls and 30 signed-url
// network requests; this does it in one of each instead.
export async function resolveEntityMediaBatch(
  entityType: string,
  entityIds: string[],
  role: "cover" | "gallery" | "attachment"
): Promise<Map<string, ResolvedMedia[]>> {
  if (entityIds.length === 0) return new Map();

  const links = await prisma.mediaLink.findMany({
    where: { entityType, entityId: { in: entityIds }, role },
    include: { media: true },
    orderBy: { createdAt: "asc" },
  });
  if (links.length === 0) return new Map();

  const urls = await getSignedMediaUrls(links.map((l) => l.media.storageKey));

  const result = new Map<string, ResolvedMedia[]>();
  for (const link of links) {
    const url = urls.get(link.media.storageKey);
    if (!url) continue;
    const existing = result.get(link.entityId) ?? [];
    existing.push({ id: link.media.id, url, type: link.media.type });
    result.set(link.entityId, existing);
  }
  return result;
}

export interface ResolvedMediaLink {
  role: string;
  label: string;
  href: string;
}

// Media library links (/media) reference an arbitrary entityType/entityId
// pair rather than a single relation, so there's no one join Prisma can
// follow — resolve titles by batching one query per entity type instead of
// one query per link.
export async function resolveMediaLinksForUser(
  userId: string,
  mediaIds: string[]
): Promise<Map<string, ResolvedMediaLink[]>> {
  if (mediaIds.length === 0) return new Map();

  const links = await prisma.mediaLink.findMany({ where: { mediaId: { in: mediaIds } } });
  if (links.length === 0) return new Map();

  const idsByType: Record<string, string[]> = {};
  for (const link of links) {
    (idsByType[link.entityType] ??= []).push(link.entityId);
  }

  const [people, memories, journalEntries, places, events, projects] = await Promise.all([
    prisma.person.findMany({
      where: { id: { in: idsByType.person ?? [] }, userId },
      select: { id: true, name: true },
    }),
    prisma.memory.findMany({
      where: { id: { in: idsByType.memory ?? [] }, userId },
      select: { id: true, title: true },
    }),
    prisma.journalEntry.findMany({
      where: { id: { in: idsByType.journal ?? [] }, userId },
      select: { id: true, title: true, occurredAt: true },
    }),
    prisma.place.findMany({
      where: { id: { in: idsByType.place ?? [] }, userId },
      select: { id: true, name: true },
    }),
    prisma.event.findMany({
      where: { id: { in: idsByType.event ?? [] }, userId },
      select: { id: true, title: true },
    }),
    prisma.project.findMany({
      where: { id: { in: idsByType.project ?? [] }, userId },
      select: { id: true, name: true },
    }),
  ]);

  const labels = new Map<string, { label: string; href: string }>();
  for (const p of people) labels.set(`person:${p.id}`, { label: p.name, href: `/people/${p.id}` });
  for (const m of memories) labels.set(`memory:${m.id}`, { label: m.title, href: `/memories/${m.id}` });
  for (const j of journalEntries) {
    labels.set(`journal:${j.id}`, {
      label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
      href: `/journal/${j.id}`,
    });
  }
  for (const p of places) labels.set(`place:${p.id}`, { label: p.name, href: `/places/${p.id}` });
  for (const e of events) labels.set(`event:${e.id}`, { label: e.title, href: `/events/${e.id}` });
  for (const p of projects) labels.set(`project:${p.id}`, { label: p.name, href: `/projects/${p.id}` });

  const result = new Map<string, ResolvedMediaLink[]>();
  for (const link of links) {
    const resolved = labels.get(`${link.entityType}:${link.entityId}`);
    if (!resolved) continue; // stale link — entity was deleted since
    const existing = result.get(link.mediaId) ?? [];
    existing.push({ role: link.role, label: resolved.label, href: resolved.href });
    result.set(link.mediaId, existing);
  }
  return result;
}
