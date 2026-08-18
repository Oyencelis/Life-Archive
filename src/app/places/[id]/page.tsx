import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { ReadMore } from "@/components/shell/ReadMore";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { deletePlace } from "../actions";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const place = await prisma.place.findFirst({ where: { id, userId: session.user.id } });

  if (!place) notFound();

  const [cover, people] = await Promise.all([
    resolveEntityMedia("place", id, "cover"),
    prisma.entityPerson.findMany({
      where: { entityType: "place", entityId: id },
      include: { person: true },
    }),
  ]);

  const facts: FeatureFact[] = [{ label: "Category", value: place.category ?? "Uncategorized" }];
  if (place.lat != null && place.lng != null) {
    facts.push({ label: "Coordinates", value: `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}` });
  }

  return (
    <EntityFeature
      eyebrow="Place"
      title={place.name}
      coverUrl={cover[0]?.url}
      tone="mint"
      facts={facts}
      backHref="/places"
      backLabel="Places"
      actions={
        <>
          <Link href={`/places/${place.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          <form action={deletePlace.bind(null, place.id)}>
            <ConfirmSubmitButton
              label="Delete"
              confirmText={`Remove ${place.name} from your archive? This can't be undone.`}
              className="btn btn-danger"
            />
          </form>
        </>
      }
    >
      {place.description ? (
        <ReadMore>
          <p className="ed-feature-description">{place.description}</p>
        </ReadMore>
      ) : (
        <p className="ed-feature-description ed-feature-description-empty">
          No description written yet.
        </p>
      )}

      {people.length > 0 && (
        <div>
          <p className="ed-feature-section-label">Who connects here</p>
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
