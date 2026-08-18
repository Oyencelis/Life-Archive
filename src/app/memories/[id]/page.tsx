import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { ReadMore } from "@/components/shell/ReadMore";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { deleteMemory } from "../actions";

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const memory = await prisma.memory.findFirst({ where: { id, userId: session.user.id } });
  if (!memory) notFound();

  const [people, tags, cover] = await Promise.all([
    prisma.entityPerson.findMany({
      where: { entityType: "memory", entityId: id },
      include: { person: true },
    }),
    prisma.entityTag.findMany({
      where: { entityType: "memory", entityId: id },
      include: { tag: true },
    }),
    resolveEntityMedia("memory", id, "cover"),
  ]);

  const facts: FeatureFact[] = [
    { label: "Date", value: memory.date ? memory.date.toISOString().slice(0, 10) : "Undated" },
  ];
  if (memory.date) facts.push({ label: "Precision", value: memory.datePrecision });
  if (memory.mood) facts.push({ label: "Mood", value: memory.mood });
  if (memory.importance) facts.push({ label: "Importance", value: `${memory.importance} / 5` });

  return (
    <EntityFeature
      eyebrow="Memory"
      title={memory.title}
      coverUrl={cover[0]?.url}
      tone="yellow"
      facts={facts}
      backHref="/memories"
      backLabel="Memories"
      actions={
        <>
          <Link href={`/memories/${memory.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          <form action={deleteMemory.bind(null, memory.id)}>
            <ConfirmSubmitButton
              label="Delete"
              confirmText={`Remove "${memory.title}" from your archive? This can't be undone.`}
              className="btn btn-danger"
            />
          </form>
        </>
      }
    >
      {memory.description ? (
        <ReadMore>
          <p className="ed-feature-description">{memory.description}</p>
        </ReadMore>
      ) : (
        <p className="ed-feature-description ed-feature-description-empty">
          No description written yet.
        </p>
      )}

      {people.length > 0 && (
        <div>
          <p className="ed-feature-section-label">Who was there</p>
          <ul className="ed-feature-chips">
            {people.map(({ person }) => (
              <li key={person.id}>
                <Link href={`/people/${person.id}`} className="tag-chip">
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <p className="ed-feature-section-label">Tags</p>
          <ul className="ed-feature-chips">
            {tags.map(({ tag }) => (
              <li key={tag.id} className="tag-chip">
                {tag.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </EntityFeature>
  );
}
