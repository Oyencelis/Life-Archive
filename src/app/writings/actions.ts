"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { WritingType, Visibility, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { upsertEmbedding, deleteEmbedding, writingEmbeddingText } from "@/lib/ai/embeddings";
import { requirePinOrError, isArchiveUnlocked } from "@/lib/auth-lock";

// .nullish() (not .optional()) — formData.get() returns null, not
// undefined, for a field with no matching <input> at all, which the leaner
// quick-add form deliberately omits (writtenAt).
const WritingSchema = z.object({
  title: z.string().trim().nullish(),
  content: z.string().trim().min(1, "Write something first"),
  type: z.string().nullish(),
  writtenAt: z.string().nullish(),
  visibility: z.string().nullish(),
});

function parseWritingForm(formData: FormData) {
  return WritingSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    type: formData.get("type"),
    writtenAt: formData.get("writtenAt"),
    visibility: formData.get("visibility"),
  });
}

function writingFields(data: z.infer<typeof WritingSchema>) {
  return {
    title: data.title || null,
    content: data.content,
    type: (data.type as WritingType) || WritingType.THOUGHT,
    writtenAt: data.writtenAt ? new Date(data.writtenAt) : null,
    visibility: (data.visibility as Visibility) || Visibility.PUBLIC,
  };
}

export async function createWriting(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = parseWritingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if ((parsed.data.visibility as Visibility) === Visibility.PRIVATE) {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const data: Prisma.WritingUncheckedCreateInput = {
    userId: session.user.id,
    ...writingFields(parsed.data),
  };
  const writing = await prisma.writing.create({ data });
  await upsertEmbedding(session.user.id, "writing", writing.id, writingEmbeddingText(writing));
  revalidatePath("/writings");
}

export async function updateWriting(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const existing = await prisma.writing.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Writing not found" };
  // A locked writing can't be edited via a crafted direct submission
  // either, not just hidden by the UI's edit button.
  if (existing.visibility === Visibility.PRIVATE && !(await isArchiveUnlocked())) {
    return { error: "This writing is locked. Unlock it first to edit." };
  }

  const parsed = parseWritingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if ((parsed.data.visibility as Visibility) === Visibility.PRIVATE) {
    const pinError = await requirePinOrError(session.user.id);
    if (pinError) return { error: pinError };
  }

  const writing = await prisma.writing.update({ where: { id }, data: writingFields(parsed.data) });
  await upsertEmbedding(session.user.id, "writing", id, writingEmbeddingText(writing));
  revalidatePath("/writings");
}

export async function deleteWriting(id: string) {
  const session = await requireSession();
  const existing = await prisma.writing.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await deleteEmbedding("writing", id);
  await prisma.writing.delete({ where: { id } });
  revalidatePath("/writings");
}
