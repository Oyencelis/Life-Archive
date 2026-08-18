import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { UnlockGate } from "@/components/shell/UnlockGate";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { isArchiveUnlocked, hasLockPin } from "@/lib/auth-lock";
import { JournalForm } from "../../JournalForm";
import { updateJournalEntry } from "../../actions";

export default async function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const entry = await prisma.journalEntry.findFirst({ where: { id, userId: session.user.id } });
  if (!entry) notFound();

  // The detail page isn't the only door in — without this check, editing a
  // locked entry directly via /journal/[id]/edit would bypass the PIN
  // entirely and hand back the full content in the form's defaultValues.
  const unlocked = entry.visibility === "PRIVATE" ? await isArchiveUnlocked() : true;
  if (!unlocked) {
    return <UnlockGate description="This entry is locked. Enter your PIN to edit it." />;
  }

  const [places, people, links, attachments, pinSet] = await Promise.all([
    prisma.place.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.entityPerson.findMany({
      where: { entityType: "journal", entityId: id },
      select: { personId: true },
    }),
    resolveEntityMedia("journal", id, "attachment"),
    hasLockPin(session.user.id),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Editing" title={entry.title ?? "Journal entry"} description="Update this entry." />
      <JournalForm
        action={updateJournalEntry.bind(null, id)}
        submitLabel="Save changes"
        places={places}
        people={people}
        hasPin={pinSet}
        defaultValues={{
          title: entry.title ?? undefined,
          content: entry.content,
          occurredAt: entry.occurredAt.toISOString().slice(0, 10),
          mood: entry.mood ?? undefined,
          visibility: entry.visibility,
          placeId: entry.placeId ?? undefined,
          personIds: links.map((l) => l.personId),
          attachments,
        }}
      />
    </div>
  );
}
