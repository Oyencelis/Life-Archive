"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

const SetupSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createOwnerAccount(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    redirect("/login");
  }

  const parsed = SetupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  // Serializable so two concurrent /setup submissions can't both pass the
  // "no owner yet" check and each create an account — the loser's
  // transaction fails with a serialization error instead.
  try {
    await prisma.$transaction(
      async (tx) => {
        const count = await tx.user.count();
        if (count > 0) {
          throw new Error("OWNER_EXISTS");
        }

        const minimalTheme = await tx.theme.findFirst({
          where: { key: "minimal", isPreset: true },
        });

        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            activeThemeId: minimalTheme?.id,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );
  } catch {
    redirect("/login");
  }

  await signIn("credentials", { email, password, redirectTo: "/" });
  return {};
}
