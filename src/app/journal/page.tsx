import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { groupByKey } from "@/lib/group-by";
import { deleteJournalEntry } from "./actions";

function yearOrder(keys: string[]) {
  return [...new Set(keys)].sort((a, b) => Number(b) - Number(a));
}

export default async function JournalPage() {
  const session = await requireSession();
  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });

  const groups = groupByKey(
    entries,
    (e) => String(e.occurredAt.getFullYear()),
    yearOrder(entries.map((e) => String(e.occurredAt.getFullYear())))
  );

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Written at the time</p>
          <h1 className="ed-index-heading">Journal</h1>
          <p className="ed-hero-desc">
            Private by default. Long-form entries written in the moment, not reconstructed later.
          </p>
        </div>
        <Link href="/journal/new" className="ed-cta-primary">
          + New entry
        </Link>
      </div>
      {entries.length === 0 ? (
        <EmptyState
          eyebrow="No entries yet"
          title="Your journal is blank."
          body="Journal entries stay private unless you mark one otherwise — this is the one section of the archive that isn't built for an audience, including future-you skimming for highlights."
          action={
            <Link href="/journal/new" className="btn btn-primary">
              Write your first entry
            </Link>
          }
        />
      ) : (
        <div className="record-groups">
          {groups.map((group) => (
            <section key={group.key} className="record-group">
              <h2 className="record-group-label">
                {group.key}
                <span className="record-group-count">({group.items.length})</span>
              </h2>
              <ul className="record-list">
                {group.items.map((e, i) => (
                  <li key={e.id} className="record-row" style={{ "--i": i } as React.CSSProperties}>
                    <Link href={`/journal/${e.id}`} className="record-row-title">
                      {e.visibility === "PRIVATE" ? "🔒 " : ""}
                      {e.title ?? e.occurredAt.toISOString().slice(0, 10)}
                    </Link>
                    <div className="record-row-actions">
                      <span className="record-row-meta">{e.occurredAt.toISOString().slice(0, 10)}</span>
                      <Link href={`/journal/${e.id}/edit`} className="btn-ghost">
                        Edit
                      </Link>
                      <form action={deleteJournalEntry.bind(null, e.id)}>
                        <ConfirmSubmitButton
                          label="Delete"
                          confirmText="Remove this journal entry? This can't be undone."
                        />
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
