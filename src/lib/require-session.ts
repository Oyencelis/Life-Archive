import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type AuthedSession = Session & { user: NonNullable<Session["user"]> };

// Middleware already blocks unauthenticated requests to every route that
// calls this, so the redirect below is a type-safety backstop, not the
// primary guard — it just gives pages a non-nullable session to work with.
export async function requireSession(): Promise<AuthedSession> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session as AuthedSession;
}
