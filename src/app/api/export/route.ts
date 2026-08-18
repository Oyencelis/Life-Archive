import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    user,
    people,
    personRelationships,
    memories,
    journalEntries,
    media,
    places,
    events,
    eras,
    timelineEvents,
    projects,
    interests,
    goals,
    writings,
    reflections,
    tags,
    entityPeople,
    entityTags,
    mediaLinks,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.person.findMany({ where: { userId } }),
    prisma.personRelationship.findMany({ where: { person: { userId } } }),
    prisma.memory.findMany({ where: { userId } }),
    prisma.journalEntry.findMany({ where: { userId } }),
    prisma.media.findMany({ where: { userId } }),
    prisma.place.findMany({ where: { userId } }),
    prisma.event.findMany({ where: { userId } }),
    prisma.era.findMany({ where: { userId } }),
    prisma.timelineEvent.findMany({ where: { userId } }),
    prisma.project.findMany({ where: { userId } }),
    prisma.interest.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.writing.findMany({ where: { userId } }),
    prisma.reflection.findMany({ where: { userId }, include: { versions: true } }),
    prisma.tag.findMany({ where: { userId } }),
    prisma.entityPerson.findMany({ where: { person: { userId } } }),
    prisma.entityTag.findMany({ where: { tag: { userId } } }),
    prisma.mediaLink.findMany({ where: { media: { userId } } }),
  ]);

  const exportDoc = {
    exportedAt: new Date().toISOString(),
    format: "life-archive/1",
    account: user,
    people,
    personRelationships,
    memories,
    journalEntries,
    media,
    places,
    events,
    eras,
    timelineEvents,
    projects,
    interests,
    goals,
    writings,
    reflections,
    tags,
    links: { entityPeople, entityTags, mediaLinks },
  };

  const filename = `archive-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportDoc, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
