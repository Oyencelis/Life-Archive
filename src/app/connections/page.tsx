import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { getOrCreateSelfProfile } from "@/lib/self-profile";
import { resolveMediaById, resolveMediaByIds } from "@/lib/storage/resolve";
import { isArchiveUnlocked } from "@/lib/auth-lock";
import { ConnectionsGraph, type GraphEdge, type GraphNode } from "./ConnectionsGraph";

// Groups same-day items into "inferred" edges. Capped so an unusually
// dense day (a big trip, say) doesn't produce a combinatorial tangle of
// lines — those days just skip the inference rather than cluttering the
// graph, while everything still stays connected to "you" individually.
function buildInferredEdges(dated: { id: string; day: string }[]): GraphEdge[] {
  const byDay = new Map<string, string[]>();
  for (const d of dated) {
    const arr = byDay.get(d.day);
    if (arr) arr.push(d.id);
    else byDay.set(d.day, [d.id]);
  }

  const edges: GraphEdge[] = [];
  for (const ids of byDay.values()) {
    if (ids.length < 2 || ids.length > 8) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        edges.push({ source: ids[i], target: ids[j], kind: "inferred" });
      }
    }
  }
  return edges;
}

export default async function ConnectionsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [self, people, relationships, entityPersonLinks, memories, journalEntries, events, unlocked] =
    await Promise.all([
      getOrCreateSelfProfile(userId, session.user.name ?? "Me"),
      prisma.person.findMany({
        where: { userId, archivedAt: null, isSelf: false },
        select: { id: true, name: true, avatarMediaId: true, isLocked: true },
      }),
      prisma.personRelationship.findMany({
        where: { person: { userId } },
        select: { personId: true, relatedPersonId: true, relationshipType: true },
      }),
      prisma.entityPerson.findMany({
        where: { person: { userId } },
        select: { personId: true, entityType: true, entityId: true },
      }),
      prisma.memory.findMany({
        where: { userId, archivedAt: null },
        select: { id: true, title: true, date: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        select: { id: true, title: true, occurredAt: true, placeId: true },
      }),
      prisma.event.findMany({
        where: { userId, archivedAt: null },
        select: { id: true, title: true, date: true, placeId: true },
      }),
      isArchiveUnlocked(),
    ]);

  const placeIds = Array.from(
    new Set(
      [
        ...journalEntries.map((j) => j.placeId),
        ...events.map((e) => e.placeId),
        // A place with people tagged directly on it (but no event/journal
        // pointing at it) still needs to be a node, or the edge below
        // would reference a node that doesn't exist.
        ...entityPersonLinks.filter((l) => l.entityType === "place").map((l) => l.entityId),
      ].filter((id): id is string => id !== null)
    )
  );
  const places = placeIds.length
    ? await prisma.place.findMany({ where: { id: { in: placeIds }, userId }, select: { id: true, name: true } })
    : [];

  const [selfAvatar, avatars] = await Promise.all([
    resolveMediaById(self.avatarMediaId),
    resolveMediaByIds(people.map((p) => p.avatarMediaId)),
  ]);

  const nodes: GraphNode[] = [
    {
      id: `person:${self.id}`,
      type: "person",
      // Masked server-side, not just hidden client-side — same reasoning
      // as the writings list: a client component's props still serialize
      // into the page payload even when a branch chooses not to render
      // them.
      label: self.isLocked && !unlocked ? "Locked" : self.name,
      href: "/me",
      isSelf: true,
      avatarUrl: self.isLocked && !unlocked ? undefined : selfAvatar?.url,
      isLocked: self.isLocked,
    },
    ...people.map((p) => ({
      id: `person:${p.id}`,
      type: "person" as const,
      label: p.isLocked && !unlocked ? "Locked" : p.name,
      href: `/people/${p.id}`,
      avatarUrl: p.isLocked && !unlocked ? undefined : avatars.get(p.avatarMediaId ?? "")?.url,
      isLocked: p.isLocked,
    })),
    ...memories.map((m) => ({ id: `memory:${m.id}`, type: "memory" as const, label: m.title, href: `/memories/${m.id}` })),
    ...journalEntries.map((j) => ({
      id: `journal:${j.id}`,
      type: "journal" as const,
      label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
      href: `/journal/${j.id}`,
    })),
    ...events.map((e) => ({ id: `event:${e.id}`, type: "event" as const, label: e.title, href: `/events/${e.id}` })),
    ...places.map((p) => ({ id: `place:${p.id}`, type: "place" as const, label: p.name, href: `/places/${p.id}` })),
  ];

  const edges: GraphEdge[] = [
    // Every person, memory, journal entry, and event is on the graph
    // because you archived it — an implicit connection back to you,
    // distinct from an explicit relationship or "was there" tag.
    ...people.map((p) => ({ source: `person:${self.id}`, target: `person:${p.id}`, kind: "archived" as const })),
    ...memories.map((m) => ({ source: `person:${self.id}`, target: `memory:${m.id}`, kind: "archived" as const })),
    ...journalEntries.map((j) => ({ source: `person:${self.id}`, target: `journal:${j.id}`, kind: "archived" as const })),
    ...events.map((e) => ({ source: `person:${self.id}`, target: `event:${e.id}`, kind: "archived" as const })),

    ...relationships.map((r) => ({
      source: `person:${r.personId}`,
      target: `person:${r.relatedPersonId}`,
      kind: "relationship" as const,
      label: r.relationshipType,
    })),

    // "Was there" / "connects here" — a person explicitly tagged on a
    // memory, journal entry, event, or place. (entityPerson also supports
    // "project", but projects aren't graph nodes, so those links are
    // skipped here.)
    ...entityPersonLinks
      .filter(
        (l) =>
          l.entityType === "memory" ||
          l.entityType === "journal" ||
          l.entityType === "event" ||
          l.entityType === "place"
      )
      .map((l) => ({
        source: `person:${l.personId}`,
        target: `${l.entityType}:${l.entityId}`,
        kind: "appearance" as const,
      })),

    // Happened here — a real placeId on the journal entry or event.
    ...journalEntries
      .filter((j) => j.placeId)
      .map((j) => ({ source: `journal:${j.id}`, target: `place:${j.placeId}`, kind: "location" as const })),
    ...events
      .filter((e) => e.placeId)
      .map((e) => ({ source: `event:${e.id}`, target: `place:${e.placeId}`, kind: "location" as const })),

    // Same day, inferred — not a recorded fact, just a coincidence worth
    // surfacing (a memory and a journal entry from the same date, etc.).
    ...buildInferredEdges([
      ...memories.filter((m) => m.date).map((m) => ({ id: `memory:${m.id}`, day: m.date!.toISOString().slice(0, 10) })),
      ...events.filter((e) => e.date).map((e) => ({ id: `event:${e.id}`, day: e.date!.toISOString().slice(0, 10) })),
      ...journalEntries.map((j) => ({ id: `journal:${j.id}`, day: j.occurredAt.toISOString().slice(0, 10) })),
    ]),
  ];

  const isEmpty = nodes.length <= 1;

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Interactive</p>
          <h1 className="ed-index-heading">Connections</h1>
          <p className="ed-hero-desc">
            A node graph of how everything in your archive relates — centered on you, since that&apos;s what connects all of it.
          </p>
        </div>
      </div>
      {isEmpty ? (
        <EmptyState
          eyebrow="Graph is empty"
          title="Nothing to visualize yet."
          body="Add a person, memory, journal entry, or event and they'll appear connected to you automatically — tag people or a place for richer edges."
        />
      ) : (
        <>
          <div className="connections-legend">
            <span>
              <span className="dot" style={{ background: "var(--color-accent)" }} />
              You / Person
            </span>
            <span>
              <span className="dot" style={{ background: "var(--color-bg-raised)", border: "1.75px solid var(--color-ink)" }} />
              Memory
            </span>
            <span>
              <span className="dot" style={{ background: "var(--mint, #93e2ce)" }} />
              Journal
            </span>
            <span>
              <span className="dot" style={{ background: "var(--yellow, #eec24c)" }} />
              Event
            </span>
            <span>
              <span className="dot" style={{ background: "var(--color-bg-raised)", border: "1.75px dashed var(--color-ink)" }} />
              Place
            </span>
            <span>Drag a node to rearrange · click to open · hover a line for what it means</span>
          </div>
          <ConnectionsGraph nodes={nodes} edges={edges} />
        </>
      )}
    </div>
  );
}
