import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tabs } from "@/components/shell/Tabs";
import { groupByKey } from "@/lib/group-by";
import { AddInterestForm } from "./AddInterestForm";
import { InterestRow } from "./InterestRow";

const STATUS_ORDER = ["CURRENT", "PAST"];

function statusLabel(status: string) {
  return status[0] + status.slice(1).toLowerCase();
}

type InterestLite = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  firstDiscovered: Date | null;
  lastActive: Date | null;
};

function InterestRows({ interests }: { interests: InterestLite[] }) {
  return (
    <ul className="record-list">
      {interests.map((interest, i) => (
        <InterestRow
          key={interest.id}
          index={i}
          interest={{
            id: interest.id,
            name: interest.name,
            category: interest.category,
            status: interest.status,
            firstDiscovered: interest.firstDiscovered
              ? interest.firstDiscovered.toISOString().slice(0, 10)
              : null,
            lastActive: interest.lastActive ? interest.lastActive.toISOString().slice(0, 10) : null,
          }}
        />
      ))}
    </ul>
  );
}

export default async function InterestsPage() {
  const session = await requireSession();
  const interests = await prisma.interest.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    take: 200,
  });

  const groups = groupByKey(interests, (i) => i.status, STATUS_ORDER);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">What you&apos;re into</p>
          <h1 className="ed-index-heading">Interests</h1>
          <p className="ed-hero-desc">
            Games, music, books, and hobbies — current and past, tracked as they change.
          </p>
        </div>
        <AddInterestForm />
      </div>
      {interests.length === 0 ? (
        <EmptyState
          eyebrow="Nothing tracked yet"
          title="No interests recorded."
          body="Mark each one current or past — interests are allowed to fade out here instead of being deleted."
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Interests by status"
          tabs={[
            { key: "all", label: "All", count: interests.length, content: <InterestRows interests={interests} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: statusLabel(group.key),
              count: group.items.length,
              content: <InterestRows interests={group.items} />,
            })),
          ]}
        />
      ) : (
        <InterestRows interests={interests} />
      )}
    </div>
  );
}
