import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { groupByKey } from "@/lib/group-by";
import { getMoodTrend } from "@/lib/discovery/mood";
import { AddReflectionForm } from "./AddReflectionForm";
import { ReflectionCard } from "./ReflectionCard";
import { MoodTrend } from "./MoodTrend";

function yearOrder(keys: string[]) {
  return [...new Set(keys)].sort((a, b) => Number(b) - Number(a));
}

export default async function InsightsPage() {
  const session = await requireSession();
  const [reflections, moodPoints] = await Promise.all([
    prisma.reflection.findMany({
      where: { userId: session.user.id },
      include: { currentVersion: true, _count: { select: { versions: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getMoodTrend(session.user.id),
  ]);
  const hasMoodData = moodPoints.some((p) => p.total > 0);

  const withVersion = reflections.filter((r) => r.currentVersion !== null);
  const groups = groupByKey(
    withVersion,
    (r) => String(r.currentVersion!.writtenAt.getFullYear()),
    yearOrder(withVersion.map((r) => String(r.currentVersion!.writtenAt.getFullYear())))
  );

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Past self, future self</p>
          <h1 className="ed-index-heading">Insights</h1>
          <p className="ed-hero-desc">
            Lessons, beliefs you&apos;ve changed your mind about, and reflections that get to keep every earlier version.
          </p>
        </div>
        <AddReflectionForm />
      </div>
      {hasMoodData && <MoodTrend points={moodPoints} />}
      {withVersion.length === 0 ? (
        <EmptyState
          eyebrow="No reflections yet"
          title="Nothing to look back on yet."
          body="A reflection written at 22 and revised at 25 both stay readable — this section is a conversation with your past self, not a place that overwrites it."
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
                {group.items.map((r, i) => (
                  <ReflectionCard
                    key={r.id}
                    index={i}
                    reflection={{
                      id: r.id,
                      subject: r.subject,
                      content: r.currentVersion!.content,
                      authorAge: r.currentVersion!.authorAge,
                      writtenAt: r.currentVersion!.writtenAt.toISOString().slice(0, 10),
                      versionCount: r._count.versions,
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
