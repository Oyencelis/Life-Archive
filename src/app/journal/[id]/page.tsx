import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { ReadMore } from "@/components/shell/ReadMore";
import { UnlockGate } from "@/components/shell/UnlockGate";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { isArchiveUnlocked } from "@/lib/auth-lock";
import { deleteJournalEntry } from "../actions";

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
    include: { place: true },
  });

  if (!entry) notFound();

  const isLocked = entry.visibility === "PRIVATE";
  const unlocked = isLocked ? await isArchiveUnlocked() : true;

  const [attachments, people] = await Promise.all([
    unlocked ? resolveEntityMedia("journal", id, "attachment") : Promise.resolve([]),
    unlocked
      ? prisma.entityPerson.findMany({
          where: { entityType: "journal", entityId: id },
          include: { person: true },
        })
      : Promise.resolve([]),
  ]);

  const facts: FeatureFact[] = [];
  if (unlocked) {
    facts.push({ label: "Date", value: entry.occurredAt.toISOString().slice(0, 10) });
    if (entry.mood) facts.push({ label: "Mood", value: entry.mood });
    if (entry.place) {
      facts.push({
        label: "Place",
        value: <Link href={`/places/${entry.place.id}`}>{entry.place.name}</Link>,
      });
    }
  }
  facts.push({ label: "Visibility", value: isLocked ? "Private (PIN required)" : "Public" });

  return (
    <EntityFeature
      eyebrow="Journal entry"
      // Title is part of what a lock is meant to hide — a revealing title
      // showing up in the page header even while the body stays gated
      // would defeat most of the point.
      title={unlocked ? (entry.title ?? entry.occurredAt.toISOString().slice(0, 10)) : "Locked entry"}
      tone="yellow"
      facts={facts}
      backHref="/journal"
      backLabel="Journal"
      actions={
        <>
          <Link href={`/journal/${entry.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          <form action={deleteJournalEntry.bind(null, entry.id)}>
            <ConfirmSubmitButton
              label="Delete"
              confirmText="Remove this journal entry? This can't be undone."
              className="btn btn-danger"
            />
          </form>
        </>
      }
    >
      {unlocked ? (
        <>
          <ReadMore>
            <p className="ed-feature-description">{entry.content}</p>
          </ReadMore>

          {people.length > 0 && (
            <div>
              <p className="ed-feature-section-label">Who was there</p>
              <ul className="ed-feature-chips">
                {people.map(({ person }) => (
                  <li key={person.id}>
                    <Link href={`/people/${person.id}`} className="tag-chip">
                      {person.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <p className="ed-feature-section-label">Photos &amp; video</p>
              <div className="ed-feature-gallery">
                {attachments.map((a) =>
                  a.type === "VIDEO" ? (
                    <video key={a.id} src={a.url} controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.id} src={a.url} alt="" />
                  )
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <UnlockGate description="This entry is locked. Enter your PIN to read it." />
      )}
    </EntityFeature>
  );
}
