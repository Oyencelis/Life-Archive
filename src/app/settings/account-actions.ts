"use server";

import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";

export async function deleteAccount(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const confirmEmail = formData.get("confirmEmail");

  if (
    typeof confirmEmail !== "string" ||
    confirmEmail.trim().toLowerCase() !== session.user.email?.toLowerCase()
  ) {
    return { error: "Type your email exactly to confirm." };
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/setup" });
}
