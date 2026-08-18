import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { EventForm } from "../../EventForm";
import { updateEvent } from "../../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [event, places, eras, people, links, cover] = await Promise.all([
    prisma.event.findFirst({ where: { id, userId: session.user.id } }),
    prisma.place.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.era.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.entityPerson.findMany({
      where: { entityType: "event", entityId: id },
      select: { personId: true },
    }),
    resolveEntityMedia("event", id, "cover"),
  ]);

  if (!event) notFound();

  return (
    <div>
      <PageHeader eyebrow="Editing" title={event.title} description="Update this event." />
      <EventForm
        action={updateEvent.bind(null, id)}
        submitLabel="Save changes"
        places={places}
        eras={eras}
        people={people}
        defaultValues={{
          title: event.title,
          description: event.description ?? undefined,
          date: event.date ? event.date.toISOString().slice(0, 10) : undefined,
          category: event.category,
          placeId: event.placeId ?? undefined,
          eraId: event.eraId ?? undefined,
          personIds: links.map((l) => l.personId),
          coverMediaId: cover[0]?.id,
          coverUrl: cover[0]?.url,
        }}
      />
    </div>
  );
}
