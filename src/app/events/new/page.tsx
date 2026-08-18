import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { EventForm } from "../EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  const session = await requireSession();
  const [places, eras, people] = await Promise.all([
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
  ]);

  return (
    <div>
      <PageHeader eyebrow="New entry" title="Add an event" description="A day worth marking." />
      <EventForm action={createEvent} submitLabel="Add event" places={places} eras={eras} people={people} />
    </div>
  );
}
