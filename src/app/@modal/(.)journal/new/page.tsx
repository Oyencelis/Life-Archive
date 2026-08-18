import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { Modal } from "@/components/shell/Modal";
import { PageHeader } from "@/components/shell/PageHeader";
import { hasLockPin } from "@/lib/auth-lock";
import { JournalForm } from "@/app/journal/JournalForm";
import { createJournalEntry } from "@/app/journal/actions";

export default async function NewJournalEntryModal() {
  const session = await requireSession();
  const [places, people, pinSet] = await Promise.all([
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
    hasLockPin(session.user.id),
  ]);

  return (
    <Modal>
      <PageHeader eyebrow="Written now" title="New entry" description="Private by default." />
      <JournalForm
        action={createJournalEntry}
        submitLabel="Save entry"
        places={places}
        people={people}
        hasPin={pinSet}
      />
    </Modal>
  );
}
