import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tabs } from "@/components/shell/Tabs";
import { groupByKey } from "@/lib/group-by";
import { isArchiveUnlocked, hasLockPin } from "@/lib/auth-lock";
import { AddWritingForm } from "./AddWritingForm";
import { WritingRow } from "./WritingRow";

const TYPE_ORDER = ["ESSAY", "QUOTE", "POEM", "LETTER", "UNSENT", "STORY", "THOUGHT"];

function typeLabel(type: string) {
  return type[0] + type.slice(1).toLowerCase();
}

type WritingLite = {
  id: string;
  title: string | null;
  content: string;
  type: string;
  writtenAt: Date | null;
  visibility: string;
};

function WritingRows({
  writings,
  unlocked,
  hasPin,
}: {
  writings: WritingLite[];
  unlocked: boolean;
  hasPin: boolean;
}) {
  return (
    <ul className="record-list">
      {writings.map((writing, i) => {
        const isLocked = writing.visibility === "PRIVATE";
        return (
          <WritingRow
            key={writing.id}
            index={i}
            unlocked={unlocked}
            hasPin={hasPin}
            writing={{
              id: writing.id,
              title: writing.title,
              // Masked here, server-side, rather than just hidden by the
              // client row — passing the real content as a prop to a client
              // component would still serialize it into the page payload
              // even while unrendered.
              content: isLocked && !unlocked ? "" : writing.content,
              type: writing.type,
              writtenAt: writing.writtenAt ? writing.writtenAt.toISOString().slice(0, 10) : null,
              isLocked,
            }}
          />
        );
      })}
    </ul>
  );
}

export default async function WritingsPage() {
  const session = await requireSession();
  const [writings, unlocked, pinSet] = await Promise.all([
    prisma.writing.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    isArchiveUnlocked(),
    hasLockPin(session.user.id),
  ]);

  const groups = groupByKey(writings, (w) => w.type, TYPE_ORDER);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Not the journal</p>
          <h1 className="ed-index-heading">Writings</h1>
          <p className="ed-hero-desc">
            Essays, quotes, poems, letters, and unsent messages — separate from what you wrote in the moment.
          </p>
        </div>
        <AddWritingForm hasPin={pinSet} />
      </div>
      {writings.length === 0 ? (
        <EmptyState
          eyebrow="Nothing written yet"
          title="This page is blank."
          body="Writings are things you composed on purpose, not entries logged as they happened."
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Writings by type"
          tabs={[
            {
              key: "all",
              label: "All",
              count: writings.length,
              content: <WritingRows writings={writings} unlocked={unlocked} hasPin={pinSet} />,
            },
            ...groups.map((group) => ({
              key: group.key,
              label: typeLabel(group.key),
              count: group.items.length,
              content: <WritingRows writings={group.items} unlocked={unlocked} hasPin={pinSet} />,
            })),
          ]}
        />
      ) : (
        <WritingRows writings={writings} unlocked={unlocked} hasPin={pinSet} />
      )}
    </div>
  );
}
