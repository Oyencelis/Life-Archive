import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveMediaById } from "@/lib/storage/resolve";
import { NavClient, type NavGroup } from "./NavClient";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Chronicle",
    links: [
      { href: "/timeline", label: "Timeline" },
      { href: "/calendar", label: "Calendar" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/people", label: "People" },
      { href: "/places", label: "Places" },
      { href: "/connections", label: "Connections" },
    ],
  },
  {
    label: "Story",
    links: [
      { href: "/memories", label: "Memories" },
      { href: "/journal", label: "Journal" },
      { href: "/media", label: "Media" },
    ],
  },
  {
    label: "Made",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/interests", label: "Interests" },
      { href: "/goals", label: "Goals" },
      { href: "/writings", label: "Writings" },
      { href: "/insights", label: "Insights" },
    ],
  },
];

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;

  // Read-only lookup — the self Person row is created lazily (see
  // getOrCreateSelfProfile, used by /me and /connections), so a
  // brand-new account just falls back to the initial-letter avatar
  // below rather than the nav creating it as a side effect.
  const self = await prisma.person.findFirst({
    where: { userId: session.user.id, isSelf: true },
    select: { avatarMediaId: true },
  });
  const avatar = self ? await resolveMediaById(self.avatarMediaId) : null;

  return (
    <header className="app-nav">
      <Link href="/" className="app-nav-mark">
        Archive
      </Link>
      <NavClient
        groups={NAV_GROUPS}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        avatarUrl={avatar?.url}
      />
    </header>
  );
}
