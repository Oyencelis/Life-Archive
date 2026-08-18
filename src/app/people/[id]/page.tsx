import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { Tabs } from "@/components/shell/Tabs";
import { ReadMore } from "@/components/shell/ReadMore";
import { UnlockGate } from "@/components/shell/UnlockGate";
import { resolveMediaById, resolveEntityMedia } from "@/lib/storage/resolve";
import { isArchiveUnlocked } from "@/lib/auth-lock";
import { deletePerson } from "../actions";
import { PersonRelationships, type RelationshipLite } from "./PersonRelationships";

const STATUS_LABELS: Record<string, string> = {
  CURRENT: "Current",
  PAST: "Past",
  LOST_CONTACT: "Lost contact",
  COMPLICATED: "Complicated",
  OCCASIONAL: "Occasional",
  FAMILY: "Family",
  OTHER: "Other",
};

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const person = await prisma.person.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!person) notFound();

  if (person.isLocked && !(await isArchiveUnlocked())) {
    return <UnlockGate description="This profile is locked. Enter your PIN to view it." />;
  }

  const [relFrom, relTo, otherPeople, memoryLinks, avatar, gallery] = await Promise.all([
    prisma.personRelationship.findMany({
      where: { personId: id },
      include: { relatedPerson: { select: { id: true, name: true } } },
    }),
    prisma.personRelationship.findMany({
      where: { relatedPersonId: id },
      include: { person: { select: { id: true, name: true } } },
    }),
    prisma.person.findMany({
      where: { userId: session.user.id, archivedAt: null, id: { not: id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.entityPerson.findMany({
      where: { personId: id, entityType: "memory" },
      select: { entityId: true },
    }),
    resolveMediaById(person.avatarMediaId),
    resolveEntityMedia("person", id, "gallery"),
  ]);

  const relationshipsRaw: RelationshipLite[] = [
    ...relFrom.map((r) => ({
      id: r.id,
      relationshipType: r.relationshipType,
      otherPerson: r.relatedPerson,
    })),
    ...relTo.map((r) => ({
      id: r.id,
      relationshipType: r.relationshipType,
      otherPerson: r.person,
    })),
  ];
  // A row could only appear in both relFrom and relTo if personId and
  // relatedPersonId were equal — the create action already refuses that,
  // so this is just cheap insurance against a future data anomaly.
  const seenRelIds = new Set<string>();
  const relationships = relationshipsRaw.filter((r) =>
    seenRelIds.has(r.id) ? false : (seenRelIds.add(r.id), true)
  );
  const connectedIds = new Set(relationships.map((r) => r.otherPerson.id));
  const candidates = otherPeople.filter((p) => !connectedIds.has(p.id));

  const memories = memoryLinks.length
    ? await prisma.memory.findMany({
        where: { id: { in: memoryLinks.map((l) => l.entityId) }, userId: session.user.id },
        select: { id: true, title: true, date: true },
        orderBy: { date: "desc" },
      })
    : [];

  const facts: FeatureFact[] = [
    { label: "Category", value: person.isSelf ? "This is you" : person.category },
  ];
  if (person.isLocked) facts.push({ label: "Locked", value: "Yes — PIN required" });
  if (person.relationshipStatus) {
    facts.push({ label: "Status", value: STATUS_LABELS[person.relationshipStatus] });
  }
  if (person.dob) facts.push({ label: "Born", value: person.dob.toISOString().slice(0, 10) });
  if (!person.isSelf && person.firstMetDate) {
    facts.push({ label: "First met", value: person.firstMetDate.toISOString().slice(0, 10) });
  }
  if (!person.isSelf && person.howWeMet) facts.push({ label: "How we met", value: person.howWeMet });

  return (
    <EntityFeature
      eyebrow={person.isSelf ? "You" : "Person"}
      title={person.name}
      coverUrl={avatar?.url}
      tone="mint"
      facts={facts}
      backHref="/people"
      backLabel="People"
      actions={
        <>
          <Link href={`/people/${person.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          {!person.isSelf && (
            <form action={deletePerson.bind(null, person.id)}>
              <ConfirmSubmitButton
                label="Delete"
                confirmText={`Remove ${person.name} from your archive? This can't be undone.`}
                className="btn btn-danger"
              />
            </form>
          )}
        </>
      }
    >
      <Tabs
        ariaLabel="Person details"
        tabs={[
          {
            key: "about",
            label: "About",
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {person.nickname && (
                  <p className="ed-feature-description" style={{ fontStyle: "italic" }}>
                    &ldquo;{person.nickname}&rdquo;
                  </p>
                )}

                {person.bio ? (
                  <ReadMore>
                    <p className="ed-feature-description">{person.bio}</p>
                  </ReadMore>
                ) : (
                  <p className="ed-feature-description ed-feature-description-empty">
                    No biography written yet.
                  </p>
                )}

                {person.notes && (
                  <div>
                    <p className="ed-feature-section-label">Private notes</p>
                    <ReadMore>
                      <p className="ed-feature-description">{person.notes}</p>
                    </ReadMore>
                  </div>
                )}
              </div>
            ),
          },
          ...(gallery.length > 0
            ? [
                {
                  key: "gallery",
                  label: "Gallery",
                  count: gallery.length,
                  content: (
                    <div className="ed-feature-gallery">
                      {gallery.map((g) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={g.id} src={g.url} alt="" />
                      ))}
                    </div>
                  ),
                },
              ]
            : []),
          ...(memories.length > 0
            ? [
                {
                  key: "appears",
                  label: "Appears in",
                  count: memories.length,
                  content: (
                    <ul className="ed-feature-chips">
                      {memories.map((m) => (
                        <li key={m.id}>
                          <Link href={`/memories/${m.id}`} className="tag-chip">
                            {m.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]
            : []),
          {
            key: "connections",
            label: "Connections",
            count: relationships.length,
            content: (
              <PersonRelationships
                personId={id}
                personName={person.name}
                relationships={relationships}
                candidates={candidates}
              />
            ),
          },
        ]}
      />
    </EntityFeature>
  );
}
