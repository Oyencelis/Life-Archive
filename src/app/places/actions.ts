"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { resolveOwnedMediaId, syncCoverImage, cleanupMediaLinks } from "@/lib/storage/cover";

const PlaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  personIds: z.array(z.string()).optional(),
  coverMediaId: z.string().optional(),
});

function parsePlaceForm(formData: FormData) {
  return PlaceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    personIds: formData.getAll("personIds"),
    coverMediaId: formData.get("coverMediaId"),
  });
}

async function syncPlacePeople(userId: string, placeId: string, personIds: string[]) {
  await prisma.entityPerson.deleteMany({ where: { entityType: "place", entityId: placeId } });
  if (personIds.length === 0) return;
  const owned = await prisma.person.findMany({
    where: { id: { in: personIds }, userId },
    select: { id: true },
  });
  await prisma.entityPerson.createMany({
    data: owned.map((p) => ({ entityType: "place", entityId: placeId, personId: p.id })),
  });
}

function placeFields(data: z.infer<typeof PlaceSchema>) {
  return {
    name: data.name,
    category: data.category || null,
    description: data.description || null,
    lat: data.lat ? Number(data.lat) : null,
    lng: data.lng ? Number(data.lng) : null,
  };
}

export async function createPlace(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parsePlaceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.PlaceUncheckedCreateInput = {
    userId: session.user.id,
    ...placeFields(parsed.data),
  };
  const place = await prisma.place.create({ data });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncCoverImage("place", place.id, coverId),
    syncPlacePeople(session.user.id, place.id, parsed.data.personIds ?? []),
  ]);

  revalidatePath("/places");
  revalidatePath("/connections");
  return { href: `/places/${place.id}` };
}

export async function updatePlace(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.place.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Place not found" };

  const parsed = parsePlaceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.place.update({ where: { id }, data: placeFields(parsed.data) });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncCoverImage("place", id, coverId),
    syncPlacePeople(session.user.id, id, parsed.data.personIds ?? []),
  ]);

  revalidatePath("/places");
  revalidatePath(`/places/${id}`);
  revalidatePath("/connections");
  return { href: `/places/${id}` };
}

export async function deletePlace(id: string) {
  const session = await requireSession();
  const existing = await prisma.place.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await cleanupMediaLinks("place", id);
  await prisma.entityPerson.deleteMany({ where: { entityType: "place", entityId: id } });
  await prisma.place.delete({ where: { id } });
  revalidatePath("/places");
  revalidatePath("/connections");
  redirect("/places");
}
