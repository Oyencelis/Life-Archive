import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { Tabs } from "@/components/shell/Tabs";
import { resolveMediaByIds } from "@/lib/storage/resolve";
import { groupByKey } from "@/lib/group-by";
import { deletePerson } from "./actions";

function categoryLabel(category: string) {
  return category ? category.charAt(0).toUpperCase() + category.slice(1) : "Uncategorized";
}

type PersonWithAvatar = {
  id: string;
  name: string;
  category: string;
  avatarUrl: string | null;
  isLocked: boolean;
};

function PersonCards({ people }: { people: PersonWithAvatar[] }) {
  return (
    <ul className="record-cards">
      {people.map((p, i) => (
        <li key={p.id} className="record-card" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/people/${p.id}`} className="record-card-link">
            <div className="record-card-media">
              {p.isLocked ? (
                <span className="record-card-media-fallback" aria-label="Locked">
                  🔒
                </span>
              ) : p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt="" />
              ) : (
                <span className="record-card-media-fallback">{p.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="record-card-body">
              <span className="record-card-title">
                {p.isLocked ? "🔒 " : ""}
                {p.name}
              </span>
              <span className="record-card-meta">{categoryLabel(p.category)}</span>
            </div>
          </Link>
          <form action={deletePerson.bind(null, p.id)} className="record-card-delete-form">
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

export default async function PeoplePage() {
  const session = await requireSession();
  const people = await prisma.person.findMany({
    where: { userId: session.user.id, archivedAt: null, isSelf: false },
    orderBy: { name: "asc" },
    take: 200,
  });

  const avatars = await resolveMediaByIds(people.map((p) => p.avatarMediaId));
  const withAvatar = people.map((p) => ({ ...p, avatarUrl: avatars.get(p.avatarMediaId ?? "")?.url ?? null }));
  const groups = groupByKey(withAvatar, (p) => p.category || "");

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Directory</p>
          <h1 className="ed-index-heading">People</h1>
          <p className="ed-hero-desc">
            Family, friends, classmates, colleagues, and everyone else who appears in your archive.
          </p>
        </div>
        <Link href="/people/new" className="ed-cta-primary">
          + New person
        </Link>
      </div>
      {people.length === 0 ? (
        <EmptyState
          eyebrow="No one yet"
          title="This directory is empty."
          body="Every person you add becomes a node in your connection graph — linked to the memories, places, and events they appear in."
          action={
            <Link href="/people/new" className="btn btn-primary">
              Add your first person
            </Link>
          }
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="People by category"
          tabs={[
            { key: "all", label: "All", count: withAvatar.length, content: <PersonCards people={withAvatar} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: categoryLabel(group.key),
              count: group.items.length,
              content: <PersonCards people={group.items} />,
            })),
          ]}
        />
      ) : (
        <PersonCards people={withAvatar} />
      )}
    </div>
  );
}
