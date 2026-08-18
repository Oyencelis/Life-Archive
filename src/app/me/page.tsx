import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getOrCreateSelfProfile } from "@/lib/self-profile";

export default async function MyProfileRedirect() {
  const session = await requireSession();
  const self = await getOrCreateSelfProfile(session.user.id, session.user.name ?? "Me");
  redirect(`/people/${self.id}`);
}
