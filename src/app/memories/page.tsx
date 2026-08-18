import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { resolveEntityMediaBatch } from "@/lib/storage/resolve";
import { groupByKey } from "@/lib/group-by";
import { deleteMemory } from "./actions";

function yearKey(date: Date | null) {
  return date ? String(date.getFullYear()) : "Undated";
}

function yearOrder(keys: string[]) {
  const years = keys.filter((k) => k !== "Undated").sort((a, b) => Number(b) - Number(a));
  return keys.includes("Undated") ? [...years, "Undated"] : years;
}

export default async function MemoriesPage() {
  const session = await requireSession();
  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { date: "desc" },
    take: 200,
  });

  const covers = await resolveEntityMediaBatch("memory", memories.map((m) => m.id), "cover");
  const withCover = memories.map((m) => ({ ...m, coverUrl: covers.get(m.id)?.[0]?.url ?? null }));
  const groups = groupByKey(withCover, (m) => yearKey(m.date), yearOrder(withCover.map((m) => yearKey(m.date))));

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Preserved</p>
          <h1 className="ed-index-heading">Memories</h1>
          <p className="ed-hero-desc">
            Experiences worth keeping — not what you wrote at the time, but what you want to remember about it.
          </p>
        </div>
        <Link href="/memories/new" className="ed-cta-primary">
          + New memory
        </Link>
      </div>
      {memories.length === 0 ? (
        <EmptyState
          eyebrow="Nothing preserved yet"
          title="No memories recorded."
          body="A memory can link to people, places, events, and photos all at once — that's what makes the archive connected rather than a pile of separate notes."
          action={
            <Link href="/memories/new" className="btn btn-primary">
              Preserve your first memory
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
              <ul className="record-cards">
                {group.items.map((m, i) => (
                  <li key={m.id} className="record-card" style={{ "--i": i } as React.CSSProperties}>
                    <Link href={`/memories/${m.id}`} className="record-card-link">
                      <div className="record-card-media">
                        {m.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.coverUrl} alt="" />
                        ) : (
                          <span className="record-card-media-fallback">
                            {m.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="record-card-body">
                        <span className="record-card-title">{m.title}</span>
                        <span className="record-card-meta">
                          {m.date ? m.date.toISOString().slice(0, 10) : m.datePrecision}
                        </span>
                      </div>
                    </Link>
                    <form action={deleteMemory.bind(null, m.id)} className="record-card-delete-form">
                      <ConfirmSubmitButton
                        label="×"
                        ariaLabel={`Delete ${m.title}`}
                        className="record-card-delete"
                        confirmText={`Remove "${m.title}" from your archive? This can't be undone.`}
                      />
                    </form>
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
