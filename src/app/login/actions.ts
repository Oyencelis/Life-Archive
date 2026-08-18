"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email or password doesn't match our records." };
    }
    throw error;
  }
}
