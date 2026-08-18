import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const UNLOCK_COOKIE = "archive_unlocked";
const UNLOCK_DURATION_SECONDS = 30 * 60;

// Whether the current browser session has unlocked isLocked content
// (JournalEntry/Writing) — a single PIN, session-scoped, distinct from the
// app-level login. Not per-entry: unlocking clears the gate for everything
// locked until the cookie expires or the browser session ends.
export async function isArchiveUnlocked(): Promise<boolean> {
  const store = await cookies();
  return store.get(UNLOCK_COOKIE)?.value === "1";
}

export async function hasLockPin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lockPinHash: true } });
  return Boolean(user?.lockPinHash);
}

// Shared gate for every "mark this Private/locked" form (JournalEntry,
// Writing, Person) — a PIN has to exist before anything can be set to
// require one, or the owner would lock themselves out of content they
// just created.
export async function requirePinOrError(userId: string): Promise<string | null> {
  return (await hasLockPin(userId)) ? null : "Set a 6-digit PIN in Settings before marking this Private.";
}

export async function setLockPin(userId: string, pin: string): Promise<void> {
  const hash = await bcrypt.hash(pin, 12);
  await prisma.user.update({ where: { id: userId }, data: { lockPinHash: hash } });
}

export async function clearLockPin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { lockPinHash: null } });
}

export async function verifyLockPin(userId: string, pin: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lockPinHash: true } });
  if (!user?.lockPinHash) return false;
  return bcrypt.compare(pin, user.lockPinHash);
}

export async function setUnlockCookie(): Promise<void> {
  const store = await cookies();
  store.set(UNLOCK_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: UNLOCK_DURATION_SECONDS,
    path: "/",
  });
}

export async function clearUnlockCookie(): Promise<void> {
  const store = await cookies();
  store.delete(UNLOCK_COOKIE);
}
