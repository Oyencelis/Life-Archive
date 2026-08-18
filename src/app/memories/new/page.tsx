import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { MemoryForm } from "../MemoryForm";
import { createMemory } from "../actions";

export default async function NewMemoryPage() {
  const session = await requireSession();
  const people = await prisma.person.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        eyebrow="New entry"
        title="Preserve a memory"
        description="Not what you wrote at the time — what you want to remember about it."
      />
      <MemoryForm action={createMemory} submitLabel="Save memory" people={people} />
    </div>
  );
}
