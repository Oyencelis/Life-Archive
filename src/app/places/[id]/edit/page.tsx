import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { PlaceForm } from "../../PlaceForm";
import { updatePlace } from "../../actions";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [place, people, links, cover] = await Promise.all([
    prisma.place.findFirst({ where: { id, userId: session.user.id } }),
    prisma.person.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.entityPerson.findMany({
      where: { entityType: "place", entityId: id },
      select: { personId: true },
    }),
    resolveEntityMedia("place", id, "cover"),
  ]);

  if (!place) notFound();

  return (
    <div>
      <PageHeader eyebrow="Editing" title={place.name} description="Update what you know about this place." />
      <PlaceForm
        action={updatePlace.bind(null, id)}
        submitLabel="Save changes"
        people={people}
        defaultValues={{
          name: place.name,
          category: place.category ?? undefined,
          description: place.description ?? undefined,
          lat: place.lat?.toString(),
          lng: place.lng?.toString(),
          personIds: links.map((l) => l.personId),
          coverMediaId: cover[0]?.id,
          coverUrl: cover[0]?.url,
        }}
      />
    </div>
  );
}
