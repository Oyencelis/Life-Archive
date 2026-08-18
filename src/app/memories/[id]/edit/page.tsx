import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { MemoryForm } from "../../MemoryForm";
import { updateMemory } from "../../actions";

export default async function EditMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [memory, people, links, tagLinks, cover] = await Promise.all([
    prisma.memory.findFirst({ where: { id, userId: session.user.id } }),
    prisma.person.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.entityPerson.findMany({
      where: { entityType: "memory", entityId: id },
      select: { personId: true },
    }),
    prisma.entityTag.findMany({
      where: { entityType: "memory", entityId: id },
      include: { tag: true },
    }),
    resolveEntityMedia("memory", id, "cover"),
  ]);

  if (!memory) notFound();

  return (
    <div>
      <PageHeader eyebrow="Editing" title={memory.title} description="Update this memory." />
      <MemoryForm
        action={updateMemory.bind(null, id)}
        submitLabel="Save changes"
        people={people}
        defaultValues={{
          title: memory.title,
          description: memory.description ?? undefined,
          date: memory.date ? memory.date.toISOString().slice(0, 10) : undefined,
          datePrecision: memory.datePrecision,
          mood: memory.mood ?? undefined,
          importance: memory.importance?.toString(),
          personIds: links.map((l) => l.personId),
          tags: tagLinks.map((t) => t.tag.label).join(", "),
          coverMediaId: cover[0]?.id,
          coverUrl: cover[0]?.url,
        }}
      />
    </div>
  );
}
