"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EventCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { resolveOwnedMediaId, syncCoverImage, cleanupMediaLinks } from "@/lib/storage/cover";

const EventSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  placeId: z.string().optional(),
  eraId: z.string().optional(),
  personIds: z.array(z.string()).optional(),
  coverMediaId: z.string().optional(),
});

function parseEventForm(formData: FormData) {
  return EventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    category: formData.get("category"),
    placeId: formData.get("placeId"),
    eraId: formData.get("eraId"),
    personIds: formData.getAll("personIds"),
    coverMediaId: formData.get("coverMediaId"),
  });
}

async function syncEventPeople(userId: string, eventId: string, personIds: string[]) {
  await prisma.entityPerson.deleteMany({ where: { entityType: "event", entityId: eventId } });
  if (personIds.length === 0) return;
  const owned = await prisma.person.findMany({
    where: { id: { in: personIds }, userId },
    select: { id: true },
  });
  await prisma.entityPerson.createMany({
    data: owned.map((p) => ({ entityType: "event", entityId: eventId, personId: p.id })),
  });
}

// A submitted placeId/eraId is untrusted input — resolve it against the
// caller's own records rather than trusting it, or a crafted id could link
// a private record to (and leak the name of) another account's place/era.
async function resolvePlaceId(userId: string, placeId: string | undefined) {
  if (!placeId) return null;
  const place = await prisma.place.findFirst({ where: { id: placeId, userId }, select: { id: true } });
  return place?.id ?? null;
}

async function resolveEraId(userId: string, eraId: string | undefined) {
  if (!eraId) return null;
  const era = await prisma.era.findFirst({ where: { id: eraId, userId }, select: { id: true } });
  return era?.id ?? null;
}

function eventFields(
  data: z.infer<typeof EventSchema>,
  placeId: string | null,
  eraId: string | null
) {
  return {
    title: data.title,
    description: data.description || null,
    date: data.date ? new Date(data.date) : null,
    category: (data.category as EventCategory) || EventCategory.OTHER,
    placeId,
    eraId,
  };
}

export async function createEvent(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const placeId = await resolvePlaceId(session.user.id, parsed.data.placeId);
  const eraId = await resolveEraId(session.user.id, parsed.data.eraId);
  const data: Prisma.EventUncheckedCreateInput = {
    userId: session.user.id,
    ...eventFields(parsed.data, placeId, eraId),
  };
  const event = await prisma.event.create({ data });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncCoverImage("event", event.id, coverId),
    syncEventPeople(session.user.id, event.id, parsed.data.personIds ?? []),
  ]);

  revalidatePath("/events");
  revalidatePath("/timeline");
  revalidatePath("/connections");
  return { href: `/events/${event.id}` };
}

export async function updateEvent(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.event.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Event not found" };

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const placeId = await resolvePlaceId(session.user.id, parsed.data.placeId);
  const eraId = await resolveEraId(session.user.id, parsed.data.eraId);
  await prisma.event.update({ where: { id }, data: eventFields(parsed.data, placeId, eraId) });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncCoverImage("event", id, coverId),
    syncEventPeople(session.user.id, id, parsed.data.personIds ?? []),
  ]);

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  revalidatePath("/timeline");
  revalidatePath("/connections");
  return { href: `/events/${id}` };
}

export async function deleteEvent(id: string) {
  const session = await requireSession();
  const existing = await prisma.event.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await cleanupMediaLinks("event", id);
  await prisma.entityPerson.deleteMany({ where: { entityType: "event", entityId: id } });
  await prisma.event.delete({ where: { id } });
  revalidatePath("/events");
  revalidatePath("/timeline");
  revalidatePath("/connections");
  redirect("/events");
}
