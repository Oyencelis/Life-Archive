import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { Tabs } from "@/components/shell/Tabs";
import { buildTimelineGroups, type TimelineItem } from "./aggregate";
import { TimelineTools } from "./TimelineTools";
import { deleteEra, deleteMilestone } from "./actions";

const KIND_LABEL: Record<TimelineItem["kind"], string> = {
  memory: "Memory",
  event: "Event",
  journal: "Journal",
  milestone: "Milestone",
};

export default async function TimelinePage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [eras, memories, events, journalEntries, milestones] = await Promise.all([
    prisma.era.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.memory.findMany({
      where: { userId, archivedAt: null, date: { not: null } },
      select: { id: true, title: true, date: true, eraId: true },
    }),
    prisma.event.findMany({
      where: { userId, archivedAt: null, date: { not: null } },
      select: { id: true, title: true, date: true, eraId: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      select: { id: true, title: true, occurredAt: true },
    }),
    prisma.timelineEvent.findMany({
      where: { userId, sourceType: "milestone" },
      select: { id: true, headline: true, date: true, eraId: true },
    }),
  ]);

  const items: TimelineItem[] = [
    ...memories.map((m) => ({
      id: m.id,
      kind: "memory" as const,
      title: m.title,
      date: m.date!,
      href: `/memories/${m.id}`,
      eraId: m.eraId,
    })),
    ...events.map((e) => ({
      id: e.id,
      kind: "event" as const,
      title: e.title,
      date: e.date!,
      href: `/events/${e.id}`,
      eraId: e.eraId,
    })),
    ...journalEntries.map((j) => ({
      id: j.id,
      kind: "journal" as const,
      title: j.title ?? "Journal entry",
      date: j.occurredAt,
      href: `/journal/${j.id}`,
      eraId: null,
    })),
    ...milestones.map((m) => ({
      id: m.id,
      kind: "milestone" as const,
      title: m.headline,
      date: m.date,
      href: "/timeline",
      eraId: m.eraId,
    })),
  ];

  const groups = buildTimelineGroups(eras, items);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Chronology</p>
          <h1 className="ed-index-heading">Timeline</h1>
          <p className="ed-hero-desc">
            Every era, milestone, and moment, laid out in the order it happened.
          </p>
        </div>
        <TimelineTools
          triggerClassName="ed-cta-primary"
          eras={eras.map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>

      <Tabs
        ariaLabel="Timeline views"
        tabs={[
          {
            key: "timeline",
            label: "Timeline",
            content:
              groups.length === 0 ? (
                <EmptyState
                  eyebrow="No eras yet"
                  title="Your timeline hasn't started."
                  body="Add a memory or event with a date, or drop in a milestone above — your timeline builds itself from what's already in your archive."
                />
              ) : (
                <div className="timeline-spine">
                  {groups.map((group, gi) => (
                    <div
                      key={group.key}
                      className="timeline-era"
                      style={{ "--i": gi } as React.CSSProperties}
                    >
                      <h2 className="timeline-era-label">{group.label}</h2>
                      {group.items.map((item) => (
                        <div key={`${item.kind}-${item.id}`} className="timeline-item">
                          <span className="timeline-item-date">
                            {item.date.toISOString().slice(0, 10)}
                          </span>
                          <span>
                            <span className="timeline-item-kind">{KIND_LABEL[item.kind]}</span>
                            {item.kind === "milestone" ? (
                              item.title
                            ) : (
                              <Link href={item.href} className="record-row-title">
                                {item.title}
                              </Link>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ),
          },
          {
            key: "eras",
            label: "Eras",
            count: eras.length,
            content:
              eras.length === 0 ? (
                <EmptyState
                  eyebrow="No eras yet"
                  title="Nothing carved out yet."
                  body="Eras group your timeline into chapters — add one from Organize above."
                />
              ) : (
                <ul className="record-list">
                  {eras.map((era, i) => (
                    <li key={era.id} className="record-row" style={{ "--i": i } as React.CSSProperties}>
                      <span className="record-row-title">{era.name}</span>
                      <form action={deleteEra.bind(null, era.id)}>
                        <ConfirmSubmitButton
                          label="Delete"
                          confirmText={`Delete the era "${era.name}"? Items inside it are kept.`}
                        />
                      </form>
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            key: "milestones",
            label: "Milestones",
            count: milestones.length,
            content:
              milestones.length === 0 ? (
                <EmptyState
                  eyebrow="No milestones yet"
                  title="No standalone milestones yet."
                  body="Milestones are dated markers that aren't a full memory or event — add one from Organize above."
                />
              ) : (
                <ul className="record-list">
                  {milestones.map((m, i) => (
                    <li key={m.id} className="record-row" style={{ "--i": i } as React.CSSProperties}>
                      <span className="record-row-title">{m.headline}</span>
                      <div className="record-row-actions">
                        <span className="record-row-meta">{m.date.toISOString().slice(0, 10)}</span>
                        <form action={deleteMilestone.bind(null, m.id)}>
                          <ConfirmSubmitButton label="Delete" confirmText={`Delete "${m.headline}"?`} />
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    </div>
  );
}
