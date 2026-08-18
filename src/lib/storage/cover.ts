import { prisma } from "@/lib/prisma";

export async function resolveOwnedMediaId(userId: string, mediaId: string | undefined) {
  if (!mediaId) return null;
  const m = await prisma.media.findFirst({ where: { id: mediaId, userId }, select: { id: true } });
  return m?.id ?? null;
}

export async function syncCoverImage(entityType: string, entityId: string, mediaId: string | null) {
  await prisma.mediaLink.deleteMany({ where: { entityType, entityId, role: "cover" } });
  if (mediaId) {
    await prisma.mediaLink.create({ data: { mediaId, entityType, entityId, role: "cover" } });
  }
}

export async function cleanupMediaLinks(entityType: string, entityId: string) {
  await prisma.mediaLink.deleteMany({ where: { entityType, entityId } });
}
