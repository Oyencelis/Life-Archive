import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { hasLockPin } from "@/lib/auth-lock";
import { JournalForm } from "../JournalForm";
import { createJournalEntry } from "../actions";

export default async function NewJournalEntryPage() {
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
    <div>
      <PageHeader eyebrow="Written now" title="New entry" description="Private by default." />
      <JournalForm
        action={createJournalEntry}
        submitLabel="Save entry"
        places={places}
        people={people}
        hasPin={pinSet}
      />
    </div>
  );
}
