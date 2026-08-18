"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DatePrecision, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { resolveOwnedMediaId, syncCoverImage, cleanupMediaLinks } from "@/lib/storage/cover";
import { upsertEmbedding, deleteEmbedding, memoryEmbeddingText } from "@/lib/ai/embeddings";

const MemorySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  date: z.string().optional(),
  datePrecision: z.string().optional(),
  mood: z.string().trim().optional(),
  importance: z.string().optional(),
  personIds: z.array(z.string()).optional(),
  tags: z.string().trim().optional(),
  coverMediaId: z.string().optional(),
});

function parseMemoryForm(formData: FormData) {
  return MemorySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    datePrecision: formData.get("datePrecision"),
    mood: formData.get("mood"),
    importance: formData.get("importance"),
    personIds: formData.getAll("personIds"),
    tags: formData.get("tags"),
    coverMediaId: formData.get("coverMediaId"),
  });
}

function memoryFields(data: z.infer<typeof MemorySchema>) {
  return {
    title: data.title,
    description: data.description || null,
    date: data.date ? new Date(data.date) : null,
    datePrecision: (data.datePrecision as DatePrecision) || DatePrecision.EXACT,
    mood: data.mood || null,
    importance: data.importance ? Number(data.importance) : null,
  };
}

function parseTagLabels(raw: string | undefined) {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

async function syncMemoryConnections(
  userId: string,
  memoryId: string,
  personIds: string[],
  tagLabels: string[]
) {
  await prisma.entityPerson.deleteMany({
    where: { entityType: "memory", entityId: memoryId },
  });
  if (personIds.length > 0) {
    const ownedPeople = await prisma.person.findMany({
      where: { id: { in: personIds }, userId },
      select: { id: true },
    });
    await prisma.entityPerson.createMany({
      data: ownedPeople.map((p) => ({
        entityType: "memory",
        entityId: memoryId,
        personId: p.id,
      })),
    });
  }

  await prisma.entityTag.deleteMany({
    where: { entityType: "memory", entityId: memoryId },
  });
  if (tagLabels.length > 0) {
    const tags = await Promise.all(
      tagLabels.map((label) =>
        prisma.tag.upsert({
          where: { userId_label: { userId, label } },
          update: {},
          create: { userId, label },
        })
      )
    );
    await prisma.entityTag.createMany({
      data: tags.map((t) => ({ entityType: "memory", entityId: memoryId, tagId: t.id })),
    });
  }
}

export async function createMemory(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parseMemoryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.MemoryUncheckedCreateInput = {
    userId: session.user.id,
    ...memoryFields(parsed.data),
  };
  const memory = await prisma.memory.create({ data });

  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncMemoryConnections(
      session.user.id,
      memory.id,
      parsed.data.personIds ?? [],
      parseTagLabels(parsed.data.tags)
    ),
    syncCoverImage("memory", memory.id, coverId),
    upsertEmbedding(session.user.id, "memory", memory.id, memoryEmbeddingText(memory)),
  ]);

  revalidatePath("/memories");
  return { href: `/memories/${memory.id}` };
}

export async function updateMemory(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.memory.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Memory not found" };

  const parsed = parseMemoryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const memory = await prisma.memory.update({ where: { id }, data: memoryFields(parsed.data) });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await Promise.all([
    syncMemoryConnections(
      session.user.id,
      id,
      parsed.data.personIds ?? [],
      parseTagLabels(parsed.data.tags)
    ),
    syncCoverImage("memory", id, coverId),
    upsertEmbedding(session.user.id, "memory", id, memoryEmbeddingText(memory)),
  ]);

  revalidatePath("/memories");
  revalidatePath(`/memories/${id}`);
  return { href: `/memories/${id}` };
}

export async function deleteMemory(id: string) {
  const session = await requireSession();
  const existing = await prisma.memory.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await prisma.entityPerson.deleteMany({ where: { entityType: "memory", entityId: id } });
  await prisma.entityTag.deleteMany({ where: { entityType: "memory", entityId: id } });
  await cleanupMediaLinks("memory", id);
  await deleteEmbedding("memory", id);
  await prisma.memory.delete({ where: { id } });

  revalidatePath("/memories");
  redirect("/memories");
}
