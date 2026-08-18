import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { Modal } from "@/components/shell/Modal";
import { PageHeader } from "@/components/shell/PageHeader";
import { MemoryForm } from "@/app/memories/MemoryForm";
import { createMemory } from "@/app/memories/actions";

export default async function NewMemoryModal() {
  const session = await requireSession();
  const people = await prisma.person.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <Modal>
      <PageHeader
        eyebrow="New entry"
        title="Preserve a memory"
        description="Not what you wrote at the time — what you want to remember about it."
      />
      <MemoryForm action={createMemory} submitLabel="Save memory" people={people} />
    </Modal>
  );
}
