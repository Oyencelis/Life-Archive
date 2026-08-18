import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { Tabs } from "@/components/shell/Tabs";
import { resolveEntityMediaBatch } from "@/lib/storage/resolve";
import { groupByKey } from "@/lib/group-by";
import { deleteEvent } from "./actions";

const CATEGORY_ORDER = [
  "BIRTHDAY",
  "GRADUATION",
  "TRIP",
  "SCHOOL",
  "FAMILY",
  "MILESTONE",
  "FIRST_MEETING",
  "ANNIVERSARY",
  "OTHER",
];

function categoryLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

type EventWithCover = {
  id: string;
  title: string;
  date: Date | null;
  coverUrl: string | null;
};

function EventCards({ events }: { events: EventWithCover[] }) {
  return (
    <ul className="record-cards">
      {events.map((e, i) => (
        <li key={e.id} className="record-card" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/events/${e.id}`} className="record-card-link">
            <div className="record-card-media">
              {e.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.coverUrl} alt="" />
              ) : (
                <span className="record-card-media-fallback">{e.title.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="record-card-body">
              <span className="record-card-title">{e.title}</span>
              <span className="record-card-meta">
                {e.date ? e.date.toISOString().slice(0, 10) : "No date"}
              </span>
            </div>
          </Link>
          <form action={deleteEvent.bind(null, e.id)} className="record-card-delete-form">
            <ConfirmSubmitButton
              label="×"
              ariaLabel={`Delete ${e.title}`}
              className="record-card-delete"
              confirmText={`Remove "${e.title}" from your archive? This can't be undone.`}
            />
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function EventsPage() {
  const session = await requireSession();
  const events = await prisma.event.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { date: "desc" },
    take: 200,
  });

  const covers = await resolveEntityMediaBatch("event", events.map((e) => e.id), "cover");
  const withCover = events.map((e) => ({ ...e, coverUrl: covers.get(e.id)?.[0]?.url ?? null }));
  const groups = groupByKey(withCover, (e) => e.category, CATEGORY_ORDER);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Occasions</p>
          <h1 className="ed-index-heading">Events</h1>
          <p className="ed-hero-desc">
            Birthdays, trips, milestones, and the memorable days that don&apos;t fit inside a single memory.
          </p>
        </div>
        <Link href="/events/new" className="ed-cta-primary">
          + New event
        </Link>
      </div>
      {events.length === 0 ? (
        <EmptyState
          eyebrow="No events yet"
          title="Nothing scheduled into the past."
          body="Events connect people, places, and memories to a specific day — the connective tissue the timeline reads from."
          action={
            <Link href="/events/new" className="btn btn-primary">
              Add your first event
            </Link>
          }
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Events by category"
          tabs={[
            { key: "all", label: "All", count: withCover.length, content: <EventCards events={withCover} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: categoryLabel(group.key),
              count: group.items.length,
              content: <EventCards events={group.items} />,
            })),
          ]}
        />
      ) : (
        <EventCards events={withCover} />
      )}
    </div>
  );
}
