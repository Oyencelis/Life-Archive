import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { Tabs } from "@/components/shell/Tabs";
import { resolveEntityMediaBatch } from "@/lib/storage/resolve";
import { groupByKey } from "@/lib/group-by";
import { deletePlace } from "./actions";

function categoryLabel(category: string) {
  return category ? category.charAt(0).toUpperCase() + category.slice(1) : "Uncategorized";
}

type PlaceWithCover = {
  id: string;
  name: string;
  category: string | null;
  coverUrl: string | null;
};

function PlaceCards({ places }: { places: PlaceWithCover[] }) {
  return (
    <ul className="record-cards">
      {places.map((p, i) => (
        <li key={p.id} className="record-card" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/places/${p.id}`} className="record-card-link">
            <div className="record-card-media">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="" />
              ) : (
                <span className="record-card-media-fallback">{p.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="record-card-body">
              <span className="record-card-title">{p.name}</span>
              <span className="record-card-meta">{categoryLabel(p.category ?? "")}</span>
            </div>
          </Link>
          <form action={deletePlace.bind(null, p.id)} className="record-card-delete-form">
            <ConfirmSubmitButton
              label="×"
              ariaLabel={`Delete ${p.name}`}
              className="record-card-delete"
              confirmText={`Remove ${p.name} from your archive? This can't be undone.`}
            />
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function PlacesPage() {
  const session = await requireSession();
  const places = await prisma.place.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    take: 200,
  });

  const covers = await resolveEntityMediaBatch("place", places.map((p) => p.id), "cover");
  const withCover = places.map((p) => ({ ...p, coverUrl: covers.get(p.id)?.[0]?.url ?? null }));
  const groups = groupByKey(withCover, (p) => p.category || "");

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Geography</p>
          <h1 className="ed-index-heading">Places</h1>
          <p className="ed-hero-desc">
            Homes, schools, cities, and the meaningful locations your memories are anchored to.
          </p>
        </div>
        <Link href="/places/new" className="ed-cta-primary">
          + New place
        </Link>
      </div>
      {places.length === 0 ? (
        <EmptyState
          eyebrow="No places yet"
          title="The map is blank."
          body="Places connect to the memories, people, and events that happened there — a list view now, a map view once enough places exist."
          action={
            <Link href="/places/new" className="btn btn-primary">
              Add your first place
            </Link>
          }
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Places by category"
          tabs={[
            { key: "all", label: "All", count: withCover.length, content: <PlaceCards places={withCover} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: categoryLabel(group.key),
              count: group.items.length,
              content: <PlaceCards places={group.items} />,
            })),
          ]}
        />
      ) : (
        <PlaceCards places={withCover} />
      )}
    </div>
  );
}
