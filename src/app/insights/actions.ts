"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

const ReflectionSchema = z.object({
  subject: z.string().trim().min(1, "Give this reflection a subject"),
  content: z.string().trim().min(1, "Write something first"),
  authorAge: z.string().optional(),
});

export async function createReflection(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = ReflectionSchema.safeParse({
    subject: formData.get("subject"),
    content: formData.get("content"),
    authorAge: formData.get("authorAge"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const reflection = await prisma.reflection.create({
    data: { userId: session.user.id, subject: parsed.data.subject },
  });
  const version = await prisma.reflectionVersion.create({
    data: {
      reflectionId: reflection.id,
      content: parsed.data.content,
      authorAge: parsed.data.authorAge ? Number(parsed.data.authorAge) : null,
    },
  });
  await prisma.reflection.update({
    where: { id: reflection.id },
    data: { currentVersionId: version.id },
  });

  revalidatePath("/insights");
}

const VersionSchema = z.object({
  content: z.string().trim().min(1, "Write something first"),
  authorAge: z.string().optional(),
});

export async function addReflectionVersion(
  reflectionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const reflection = await prisma.reflection.findFirst({
    where: { id: reflectionId, userId: session.user.id },
  });
  if (!reflection) return { error: "Reflection not found" };

  const parsed = VersionSchema.safeParse({
    content: formData.get("content"),
    authorAge: formData.get("authorAge"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const version = await prisma.reflectionVersion.create({
    data: {
      reflectionId,
      content: parsed.data.content,
      authorAge: parsed.data.authorAge ? Number(parsed.data.authorAge) : null,
    },
  });
  await prisma.reflection.update({
    where: { id: reflectionId },
    data: { currentVersionId: version.id },
  });

  revalidatePath("/insights");
  revalidatePath(`/insights/${reflectionId}`);
}

export async function deleteReflection(id: string) {
  const session = await requireSession();
  const existing = await prisma.reflection.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  // Break the current-version FK first — Reflection -> ReflectionVersion has
  // no cascade of its own, only ReflectionVersion -> Reflection does.
  await prisma.reflection.update({ where: { id }, data: { currentVersionId: null } });
  await prisma.reflection.delete({ where: { id } });

  revalidatePath("/insights");
}
