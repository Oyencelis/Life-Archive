import { Modal } from "@/components/shell/Modal";
import { PageHeader } from "@/components/shell/PageHeader";
import { requireSession } from "@/lib/require-session";
import { hasLockPin } from "@/lib/auth-lock";
import { PersonForm } from "@/app/people/PersonForm";
import { createPerson } from "@/app/people/actions";

export default async function NewPersonModal() {
  const session = await requireSession();
  const pinSet = await hasLockPin(session.user.id);

  return (
    <Modal>
      <PageHeader
        eyebrow="New entry"
        title="Add a person"
        description="Family, a friend, someone you just met — whatever category fits."
      />
      <PersonForm action={createPerson} submitLabel="Add person" hasPin={pinSet} />
    </Modal>
  );
}
