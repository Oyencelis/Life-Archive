"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { deleteMediaObject } from "@/lib/storage/media";

export async function updateMediaCaption(
  mediaId: string,
  altText: string
): Promise<{ error?: string }> {
  const session = await requireSession();
  const media = await prisma.media.findFirst({ where: { id: mediaId, userId: session.user.id } });
  if (!media) return { error: "Not found" };

  await prisma.media.update({ where: { id: mediaId }, data: { altText: altText.trim() || null } });
  revalidatePath("/media");
  return {};
}

export async function deleteMedia(mediaId: string, revalidate?: string) {
  const session = await requireSession();
  const media = await prisma.media.findFirst({ where: { id: mediaId, userId: session.user.id } });
  if (!media) return;

  await deleteMediaObject(media.storageKey);
  await prisma.media.delete({ where: { id: mediaId } });

  if (revalidate) revalidatePath(revalidate);
}

export async function linkMedia(
  mediaId: string,
  entityType: string,
  entityId: string,
  role: "cover" | "gallery" | "attachment",
  revalidate?: string
) {
  const session = await requireSession();
  const media = await prisma.media.findFirst({ where: { id: mediaId, userId: session.user.id } });
  if (!media) return;

  if (role === "cover") {
    await prisma.mediaLink.deleteMany({ where: { entityType, entityId, role: "cover" } });
  }
  await prisma.mediaLink.create({ data: { mediaId, entityType, entityId, role } });

  if (revalidate) revalidatePath(revalidate);
}

export async function setPersonAvatar(personId: string, mediaId: string | null) {
  const session = await requireSession();
  const person = await prisma.person.findFirst({ where: { id: personId, userId: session.user.id } });
  if (!person) return;

  if (mediaId) {
    const media = await prisma.media.findFirst({ where: { id: mediaId, userId: session.user.id } });
    if (!media) return;
  }

  await prisma.person.update({ where: { id: personId }, data: { avatarMediaId: mediaId } });
  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
}
