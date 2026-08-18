import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { ReadMore } from "@/components/shell/ReadMore";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { deleteEvent } from "../actions";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
    include: { place: true, era: true },
  });

  if (!event) notFound();

  const [cover, people] = await Promise.all([
    resolveEntityMedia("event", id, "cover"),
    prisma.entityPerson.findMany({
      where: { entityType: "event", entityId: id },
      include: { person: true },
    }),
  ]);

  const facts: FeatureFact[] = [
    { label: "Date", value: event.date ? event.date.toISOString().slice(0, 10) : "Undated" },
    { label: "Category", value: event.category },
  ];
  if (event.place) {
    facts.push({
      label: "Place",
      value: <Link href={`/places/${event.place.id}`}>{event.place.name}</Link>,
    });
  }
  if (event.era) {
    facts.push({ label: "Era", value: <Link href="/timeline">{event.era.name}</Link> });
  }

  return (
    <EntityFeature
      eyebrow="Event"
      title={event.title}
      coverUrl={cover[0]?.url}
      tone="terracotta"
      facts={facts}
      backHref="/events"
      backLabel="Events"
      actions={
        <>
          <Link href={`/events/${event.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          <form action={deleteEvent.bind(null, event.id)}>
            <ConfirmSubmitButton
              label="Delete"
              confirmText={`Remove "${event.title}" from your archive? This can't be undone.`}
              className="btn btn-danger"
            />
          </form>
        </>
      }
    >
      {event.description ? (
        <ReadMore>
          <p className="ed-feature-description">{event.description}</p>
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
    </EntityFeature>
  );
}
