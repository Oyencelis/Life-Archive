import { prisma } from "@/lib/prisma";

// Every archive has exactly one "self" Person — the owner, represented the
// same way as anyone else so the same profile UI, image upload, and
// connection graph all just work without a parallel code path.
export async function getOrCreateSelfProfile(userId: string, fallbackName: string) {
  const existing = await prisma.person.findFirst({ where: { userId, isSelf: true } });
  if (existing) return existing;

  return prisma.person.create({
    data: {
      userId,
      name: fallbackName || "Me",
      category: "Self",
      isSelf: true,
      bio: null,
    },
  });
}
