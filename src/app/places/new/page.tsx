import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { PlaceForm } from "../PlaceForm";
import { createPlace } from "../actions";

export default async function NewPlacePage() {
  const session = await requireSession();
  const people = await prisma.person.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader eyebrow="New entry" title="Add a place" description="Anywhere meaningful enough to remember." />
      <PlaceForm action={createPlace} submitLabel="Add place" people={people} />
    </div>
  );
}
