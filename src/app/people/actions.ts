"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RelationshipStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { getOrCreateSelfProfile } from "@/lib/self-profile";
import { requirePinOrError, isArchiveUnlocked } from "@/lib/auth-lock";

// .nullish() (not .optional()) on firstMetDate/howWeMet/isLocked —
// formData.get() returns null, not undefined, for a field with no
// matching <input> at all, which PersonForm omits for isSelf (see
// PersonForm.tsx).
const PersonSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nickname: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required"),
  relationshipStatus: z.string().optional(),
  dob: z.string().optional(),
  firstMetDate: z.string().nullish(),
  howWeMet: z.string().trim().nullish(),
  bio: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  avatarMediaId: z.string().optional(),
  galleryMediaIds: z.array(z.string()).optional(),
  isLocked: z.string().nullish(),
});

function parsePersonForm(formData: FormData) {
  return PersonSchema.safeParse({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    category: formData.get("category"),
    relationshipStatus: formData.get("relationshipStatus"),
    dob: formData.get("dob"),
    firstMetDate: formData.get("firstMetDate"),
    howWeMet: formData.get("howWeMet"),
    bio: formData.get("bio"),
    notes: formData.get("notes"),
    avatarMediaId: formData.get("avatarMediaId"),
    galleryMediaIds: formData.getAll("galleryMediaIds"),
    isLocked: formData.get("isLocked"),
  });
}

// Media ids submitted from the form are untrusted — only ever use ones the
// caller actually owns.
async function resolveMediaIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const owned = await prisma.media.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  return owned.map((m) => m.id);
}

function personFields(data: z.infer<typeof PersonSchema>, avatarMediaId: string | null) {
  return {
    name: data.name,
    nickname: data.nickname || null,
    category: data.category,
    relationshipStatus: data.relationshipStatus
      ? (data.relationshipStatus as RelationshipStatus)
      : null,
    dob: data.dob ? new Date(data.dob) : null,
    firstMetDate: data.firstMetDate ? new Date(data.firstMetDate) : null,
    howWeMet: data.howWeMet || null,
    bio: data.bio || null,
    notes: data.notes || null,
    avatarMediaId,
    isLocked: data.isLocked === "on",
  };
}

async function syncGallery(personId: string, mediaIds: string[]) {
  await prisma.mediaLink.deleteMany({ where: { entityType: "person", entityId: personId, role: "gallery" } });
  if (mediaIds.length > 0) {
    await prisma.mediaLink.createMany({
      data: mediaIds.map((mediaId) => ({ mediaId, entityType: "person", entityId: personId, role: "gallery" })),
    });
  }
}

export async function createPerson(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parsePersonForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.isLocked === "on") {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const [avatarIds, galleryIds] = await Promise.all([
    resolveMediaIds(session.user.id, parsed.data.avatarMediaId ? [parsed.data.avatarMediaId] : []),
    resolveMediaIds(session.user.id, parsed.data.galleryMediaIds ?? []),
  ]);

  const data: Prisma.PersonUncheckedCreateInput = {
    userId: session.user.id,
    ...personFields(parsed.data, avatarIds[0] ?? null),
  };
  const person = await prisma.person.create({ data });
  await syncGallery(person.id, galleryIds);

  // Every person you add is someone in YOUR archive — this is a personal
  // record, not a shared directory, so they're always connected to you.
  // The self profile is get-or-create (it may not exist yet on someone's
  // very first person) and the category doubles as a sensible default
  // relationship label (Family, Friend, Colleague, ...), editable/removable
  // afterward like any other connection.
  const self = await getOrCreateSelfProfile(session.user.id, session.user.name ?? "Me");
  await prisma.personRelationship.create({
    data: {
      personId: person.id,
      relatedPersonId: self.id,
      relationshipType: parsed.data.category,
    },
  });

  revalidatePath("/people");
  revalidatePath("/me");
  // The client navigates on success (see PersonForm) rather than this action
  // calling redirect() — a server-side redirect from inside an intercepted
  // modal route doesn't reliably clear the @modal slot in Next's App Router.
  return { href: `/people/${person.id}` };
}

export async function updatePerson(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.person.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Person not found" };
  // A locked profile can't be edited via a crafted direct submission
  // either, not just kept out of reach by the edit page's own gate.
  if (existing.isLocked && !(await isArchiveUnlocked())) {
    return { error: "This profile is locked. Unlock it first to edit." };
  }

  const parsed = parsePersonForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.isLocked === "on") {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const [avatarIds, galleryIds] = await Promise.all([
    resolveMediaIds(session.user.id, parsed.data.avatarMediaId ? [parsed.data.avatarMediaId] : []),
    resolveMediaIds(session.user.id, parsed.data.galleryMediaIds ?? []),
  ]);

  await prisma.person.update({ where: { id }, data: personFields(parsed.data, avatarIds[0] ?? null) });
  await syncGallery(id, galleryIds);

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  return { href: `/people/${id}` };
}

export async function deletePerson(id: string) {
  const session = await requireSession();
  const existing = await prisma.person.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing || existing.isSelf) return;

  await prisma.mediaLink.deleteMany({ where: { entityType: "person", entityId: id } });
  await prisma.person.delete({ where: { id } });
  revalidatePath("/people");
  redirect("/people");
}

const RelationshipSchema = z.object({
  relatedPersonIds: z.array(z.string().trim().min(1)).min(1, "Choose at least one person"),
  relationshipType: z.string().trim().min(1, "Describe the relationship"),
});

export async function addPersonRelationship(
  personId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = RelationshipSchema.safeParse({
    relatedPersonIds: formData.getAll("relatedPersonId"),
    relationshipType: formData.get("relationshipType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.relatedPersonIds.includes(personId)) {
    return { error: "A person can't be connected to themselves" };
  }

  const [person, relatedPeople] = await Promise.all([
    prisma.person.findFirst({ where: { id: personId, userId: session.user.id } }),
    prisma.person.findMany({
      where: { id: { in: parsed.data.relatedPersonIds }, userId: session.user.id },
      select: { id: true },
    }),
  ]);
  if (!person || relatedPeople.length === 0) return { error: "Person not found" };

  // Knowing people through people is the whole point of a connection graph
  // — one submit can link several people at once instead of forcing a
  // separate round trip (and re-typed relationship label) per person.
  await prisma.personRelationship.createMany({
    data: relatedPeople.map((rp) => ({
      personId,
      relatedPersonId: rp.id,
      relationshipType: parsed.data.relationshipType,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/people/${personId}`);
}

export async function removePersonRelationship(id: string, personId: string) {
  const session = await requireSession();
  const existing = await prisma.personRelationship.findFirst({
    where: {
      id,
      OR: [
        { person: { userId: session.user.id } },
        { relatedPerson: { userId: session.user.id } },
      ],
    },
  });
  if (!existing) return;

  await prisma.personRelationship.delete({ where: { id } });
  revalidatePath(`/people/${personId}`);
}
