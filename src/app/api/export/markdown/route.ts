import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "undated";
}

function section(title: string, body: string) {
  return body ? `\n## ${title}\n\n${body}\n` : "";
}

// Includes locked entries in full — the account password already gates
// this route, and the sensitive-content PIN (see src/lib/auth-lock.ts)
// exists to keep entries out of casual browsing and AI answers, not out of
// the owner's own deliberate full export of their own data.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, memories, journalEntries, writings, reflections, people, places, events, projects, goals] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.memory.findMany({ where: { userId, archivedAt: null }, orderBy: { date: "asc" } }),
      prisma.journalEntry.findMany({ where: { userId }, orderBy: { occurredAt: "asc" } }),
      prisma.writing.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.reflection.findMany({ where: { userId }, include: { currentVersion: true } }),
      prisma.person.findMany({ where: { userId, archivedAt: null }, orderBy: { name: "asc" } }),
      prisma.place.findMany({ where: { userId, archivedAt: null }, orderBy: { name: "asc" } }),
      prisma.event.findMany({ where: { userId, archivedAt: null }, orderBy: { date: "asc" } }),
      prisma.project.findMany({ where: { userId, archivedAt: null }, orderBy: { startDate: "asc" } }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    ]);

  const md = [
    `# ${user?.name ?? "Life Archive"}`,
    `Exported ${new Date().toISOString().slice(0, 10)} · ${user?.email ?? ""}`,
    section(
      "Journal",
      journalEntries
        .map((j) => `### ${fmtDate(j.occurredAt)}${j.title ? ` — ${j.title}` : ""}\n\n${j.content}`)
        .join("\n\n")
    ),
    section(
      "Memories",
      memories.map((m) => `### ${fmtDate(m.date)} — ${m.title}\n\n${m.description ?? ""}`).join("\n\n")
    ),
    section(
      "Writings",
      writings
        .map((w) => `### ${w.title ?? w.type}${w.writtenAt ? ` — ${fmtDate(w.writtenAt)}` : ""}\n\n${w.content}`)
        .join("\n\n")
    ),
    section(
      "Reflections",
      reflections
        .filter((r) => r.currentVersion)
        .map((r) => `### ${r.subject}\n\n${r.currentVersion!.content}`)
        .join("\n\n")
    ),
    section(
      "People",
      people
        .map((p) => `- **${p.name}** (${p.category}${p.relationshipStatus ? `, ${p.relationshipStatus}` : ""})${p.bio ? ` — ${p.bio}` : ""}`)
        .join("\n")
    ),
    section("Places", places.map((p) => `- **${p.name}**${p.description ? ` — ${p.description}` : ""}`).join("\n")),
    section(
      "Events",
      events.map((e) => `- ${fmtDate(e.date)} — **${e.title}**${e.description ? ` — ${e.description}` : ""}`).join("\n")
    ),
    section(
      "Projects",
      projects.map((p) => `- **${p.name}** (${p.status})${p.description ? ` — ${p.description}` : ""}`).join("\n")
    ),
    section("Goals", goals.map((g) => `- **${g.title}** (${g.status}, ${g.progress ?? 0}%)`).join("\n")),
  ].join("\n");

  const filename = `archive-export-${new Date().toISOString().slice(0, 10)}.md`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
