"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { GoalStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

// .nullish() (not .optional()) — formData.get() returns null, not
// undefined, for a field with no matching <input> at all, which the leaner
// quick-add form deliberately omits (status, startDate, progress, reflection).
const GoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullish(),
  category: z.string().trim().nullish(),
  status: z.string().nullish(),
  startDate: z.string().nullish(),
  targetDate: z.string().nullish(),
  progress: z.string().nullish(),
  reflection: z.string().trim().nullish(),
});

function parseGoalForm(formData: FormData) {
  return GoalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    targetDate: formData.get("targetDate"),
    progress: formData.get("progress"),
    reflection: formData.get("reflection"),
  });
}

function goalFields(data: z.infer<typeof GoalSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    status: (data.status as GoalStatus) || GoalStatus.ACTIVE,
    startDate: data.startDate ? new Date(data.startDate) : null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    progress: data.progress ? Number(data.progress) : 0,
    reflection: data.reflection || null,
  };
}

export async function createGoal(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = parseGoalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.GoalUncheckedCreateInput = {
    userId: session.user.id,
    ...goalFields(parsed.data),
  };
  await prisma.goal.create({ data });
  revalidatePath("/goals");
}

export async function updateGoal(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Goal not found" };

  const parsed = parseGoalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.goal.update({ where: { id }, data: goalFields(parsed.data) });
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const session = await requireSession();
  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
}

export async function addGoalCheckIn(
  goalId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId: session.user.id } });
  if (!existing) return { error: "Goal not found" };

  const progress = Number(formData.get("progress"));
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    return { error: "Progress must be between 0 and 100" };
  }
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

  await prisma.$transaction([
    prisma.goalCheckIn.create({ data: { goalId, progress, note } }),
    prisma.goal.update({ where: { id: goalId }, data: { progress } }),
  ]);

  revalidatePath("/goals");
}
