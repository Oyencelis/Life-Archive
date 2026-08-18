"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Visibility, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { upsertEmbedding, deleteEmbedding, journalEmbeddingText } from "@/lib/ai/embeddings";
import { requirePinOrError } from "@/lib/auth-lock";

const JournalSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().trim().min(1, "Write something first"),
  occurredAt: z.string().optional(),
  mood: z.string().trim().optional(),
  visibility: z.string().optional(),
  placeId: z.string().optional(),
  personIds: z.array(z.string()).optional(),
  attachmentMediaIds: z.array(z.string()).optional(),
});

function parseJournalForm(formData: FormData) {
  return JournalSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    occurredAt: formData.get("occurredAt"),
    mood: formData.get("mood"),
    visibility: formData.get("visibility"),
    placeId: formData.get("placeId"),
    personIds: formData.getAll("personIds"),
    attachmentMediaIds: formData.getAll("attachmentMediaIds"),
  });
}

async function syncJournalPeople(userId: string, entryId: string, personIds: string[]) {
  await prisma.entityPerson.deleteMany({ where: { entityType: "journal", entityId: entryId } });
  if (personIds.length === 0) return;
  const owned = await prisma.person.findMany({
    where: { id: { in: personIds }, userId },
    select: { id: true },
  });
  await prisma.entityPerson.createMany({
    data: owned.map((p) => ({ entityType: "journal", entityId: entryId, personId: p.id })),
  });
}

async function resolveMediaIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const owned = await prisma.media.findMany({ where: { id: { in: ids }, userId }, select: { id: true } });
  return owned.map((m) => m.id);
}

async function syncAttachments(entryId: string, mediaIds: string[]) {
  await prisma.mediaLink.deleteMany({ where: { entityType: "journal", entityId: entryId, role: "attachment" } });
  if (mediaIds.length > 0) {
    await prisma.mediaLink.createMany({
      data: mediaIds.map((mediaId) => ({ mediaId, entityType: "journal", entityId: entryId, role: "attachment" })),
    });
  }
}

// A submitted placeId is untrusted input — resolve it against the caller's
// own places rather than trusting it, or a crafted id could link a private
// record to (and leak the name of) another account's place.
async function resolvePlaceId(userId: string, placeId: string | undefined) {
  if (!placeId) return null;
  const place = await prisma.place.findFirst({ where: { id: placeId, userId }, select: { id: true } });
  return place?.id ?? null;
}

function journalFields(data: z.infer<typeof JournalSchema>, placeId: string | null) {
  return {
    title: data.title || null,
    content: data.content,
    occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
    mood: data.mood || null,
    // Defaults to PUBLIC (not PRIVATE) even though the schema column
    // defaults to PRIVATE — PRIVATE now means PIN-gated, and a brand-new
    // account has no PIN yet, so defaulting new entries into a state that
    // can't be saved without one would be a trap.
    visibility: (data.visibility as Visibility) || Visibility.PUBLIC,
    placeId,
  };
}

export async function createJournalEntry(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parseJournalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if ((parsed.data.visibility as Visibility) === Visibility.PRIVATE) {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const [placeId, attachmentIds] = await Promise.all([
    resolvePlaceId(session.user.id, parsed.data.placeId),
    resolveMediaIds(session.user.id, parsed.data.attachmentMediaIds ?? []),
  ]);
  const data: Prisma.JournalEntryUncheckedCreateInput = {
    userId: session.user.id,
    ...journalFields(parsed.data, placeId),
  };
  const entry = await prisma.journalEntry.create({ data });
  await Promise.all([
    syncAttachments(entry.id, attachmentIds),
    syncJournalPeople(session.user.id, entry.id, parsed.data.personIds ?? []),
    upsertEmbedding(session.user.id, "journal", entry.id, journalEmbeddingText(entry)),
  ]);

  revalidatePath("/journal");
  revalidatePath("/connections");
  return { href: `/journal/${entry.id}` };
}

export async function updateJournalEntry(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Entry not found" };

  const parsed = parseJournalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if ((parsed.data.visibility as Visibility) === Visibility.PRIVATE) {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const [placeId, attachmentIds] = await Promise.all([
    resolvePlaceId(session.user.id, parsed.data.placeId),
    resolveMediaIds(session.user.id, parsed.data.attachmentMediaIds ?? []),
  ]);
  const entry = await prisma.journalEntry.update({ where: { id }, data: journalFields(parsed.data, placeId) });
  await Promise.all([
    syncAttachments(id, attachmentIds),
    syncJournalPeople(session.user.id, id, parsed.data.personIds ?? []),
    upsertEmbedding(session.user.id, "journal", id, journalEmbeddingText(entry)),
  ]);

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  revalidatePath("/connections");
  return { href: `/journal/${id}` };
}

export async function deleteJournalEntry(id: string) {
  const session = await requireSession();
  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return;

  await prisma.mediaLink.deleteMany({ where: { entityType: "journal", entityId: id } });
  await prisma.entityPerson.deleteMany({ where: { entityType: "journal", entityId: id } });
  await deleteEmbedding("journal", id);
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath("/journal");
  revalidatePath("/connections");
  redirect("/journal");
}
