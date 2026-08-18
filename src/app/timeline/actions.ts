"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

const EraSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  sortOrder: z.string().nullish(),
});

export async function createEra(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = EraSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.EraUncheckedCreateInput = {
    userId: session.user.id,
    name: parsed.data.name,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    sortOrder: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
  };
  await prisma.era.create({ data });

  revalidatePath("/timeline");
}

export async function deleteEra(id: string) {
  const session = await requireSession();
  const existing = await prisma.era.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await prisma.era.delete({ where: { id } });
  revalidatePath("/timeline");
}

const MilestoneSchema = z.object({
  headline: z.string().trim().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  eraId: z.string().nullish(),
});

export async function createMilestone(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = MilestoneSchema.safeParse({
    headline: formData.get("headline"),
    date: formData.get("date"),
    eraId: formData.get("eraId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.timelineEvent.create({
    data: {
      userId: session.user.id,
      eraId: parsed.data.eraId || null,
      sourceType: "milestone",
      sourceId: "",
      date: new Date(parsed.data.date),
      headline: parsed.data.headline,
    },
  });

  revalidatePath("/timeline");
}

export async function deleteMilestone(id: string) {
  const session = await requireSession();
  const existing = await prisma.timelineEvent.findFirst({
    where: { id, userId: session.user.id, sourceType: "milestone" },
  });
  if (!existing) return;

  await prisma.timelineEvent.delete({ where: { id } });
  revalidatePath("/timeline");
}
