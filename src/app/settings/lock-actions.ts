"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import {
  setLockPin,
  clearLockPin,
  verifyLockPin,
  setUnlockCookie,
  clearUnlockCookie,
} from "@/lib/auth-lock";

const PinSchema = z.string().trim().regex(/^\d{6}$/, "PIN must be exactly 6 digits");

export async function updateLockPin(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await requireSession();
  const parsed = PinSchema.safeParse(formData.get("pin"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid PIN" };
  }

  await setLockPin(session.user.id, parsed.data);
  revalidatePath("/settings");
  return { success: "PIN saved." };
}

export async function removeLockPin(): Promise<void> {
  const session = await requireSession();
  await clearLockPin(session.user.id);
  await clearUnlockCookie();
  revalidatePath("/settings");
}

export async function unlockArchive(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  const pin = String(formData.get("pin") ?? "");
  const valid = await verifyLockPin(session.user.id, pin);
  if (!valid) return { error: "Incorrect PIN" };
  await setUnlockCookie();
}

export async function lockArchive(): Promise<void> {
  await requireSession();
  await clearUnlockCookie();
}
