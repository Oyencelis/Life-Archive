import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { Modal } from "@/components/shell/Modal";
import { PageHeader } from "@/components/shell/PageHeader";
import { PlaceForm } from "@/app/places/PlaceForm";
import { createPlace } from "@/app/places/actions";

export default async function NewPlaceModal() {
  const session = await requireSession();
  const people = await prisma.person.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <Modal>
      <PageHeader eyebrow="New entry" title="Add a place" description="Anywhere meaningful enough to remember." />
      <PlaceForm action={createPlace} submitLabel="Add place" people={people} />
    </Modal>
  );
}
