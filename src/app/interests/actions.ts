"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { InterestStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

// .nullish() (not .optional()) — formData.get() returns null, not
// undefined, for a field with no matching <input> at all, which the leaner
// quick-add forms deliberately omit (firstDiscovered, lastActive).
const InterestSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().nullish(),
  status: z.string().nullish(),
  firstDiscovered: z.string().nullish(),
  lastActive: z.string().nullish(),
});

function parseInterestForm(formData: FormData) {
  return InterestSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    status: formData.get("status"),
    firstDiscovered: formData.get("firstDiscovered"),
    lastActive: formData.get("lastActive"),
  });
}

function interestFields(data: z.infer<typeof InterestSchema>) {
  return {
    name: data.name,
    category: data.category || null,
    status: (data.status as InterestStatus) || InterestStatus.CURRENT,
    firstDiscovered: data.firstDiscovered ? new Date(data.firstDiscovered) : null,
    lastActive: data.lastActive ? new Date(data.lastActive) : null,
  };
}

export async function createInterest(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const parsed = parseInterestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.InterestUncheckedCreateInput = {
    userId: session.user.id,
    ...interestFields(parsed.data),
  };
  await prisma.interest.create({ data });
  revalidatePath("/interests");
}

export async function updateInterest(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const existing = await prisma.interest.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Interest not found" };

  const parsed = parseInterestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.interest.update({ where: { id }, data: interestFields(parsed.data) });
  revalidatePath("/interests");
}

export async function deleteInterest(id: string) {
  const session = await requireSession();
  const existing = await prisma.interest.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await prisma.interest.delete({ where: { id } });
  revalidatePath("/interests");
}
