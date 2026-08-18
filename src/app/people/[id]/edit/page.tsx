import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { UnlockGate } from "@/components/shell/UnlockGate";
import { resolveMediaById, resolveEntityMedia } from "@/lib/storage/resolve";
import { isArchiveUnlocked, hasLockPin } from "@/lib/auth-lock";
import { PersonForm } from "../../PersonForm";
import { updatePerson } from "../../actions";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const person = await prisma.person.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!person) notFound();

  // Same reasoning as the journal edit gate — the edit page is a second
  // door into locked content, not just the profile page.
  const unlocked = person.isLocked ? await isArchiveUnlocked() : true;
  if (!unlocked) {
    return <UnlockGate description="This profile is locked. Enter your PIN to edit it." />;
  }

  const [avatar, gallery, pinSet] = await Promise.all([
    resolveMediaById(person.avatarMediaId),
    resolveEntityMedia("person", id, "gallery"),
    hasLockPin(session.user.id),
  ]);

  const boundUpdate = updatePerson.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Editing" title={person.name} description="Update what you know about them." />
      <PersonForm
        action={boundUpdate}
        submitLabel="Save changes"
        isSelf={person.isSelf}
        hasPin={pinSet}
        defaultValues={{
          name: person.name,
          nickname: person.nickname ?? undefined,
          category: person.category,
          relationshipStatus: person.relationshipStatus ?? "",
          dob: person.dob ? person.dob.toISOString().slice(0, 10) : undefined,
          firstMetDate: person.firstMetDate
            ? person.firstMetDate.toISOString().slice(0, 10)
            : undefined,
          howWeMet: person.howWeMet ?? undefined,
          bio: person.bio ?? undefined,
          notes: person.notes ?? undefined,
          avatarMediaId: avatar?.id,
          avatarUrl: avatar?.url,
          gallery,
          isLocked: person.isLocked,
        }}
      />
    </div>
  );
}
