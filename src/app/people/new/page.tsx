import { PageHeader } from "@/components/shell/PageHeader";
import { requireSession } from "@/lib/require-session";
import { hasLockPin } from "@/lib/auth-lock";
import { PersonForm } from "../PersonForm";
import { createPerson } from "../actions";

export default async function NewPersonPage() {
  const session = await requireSession();
  const pinSet = await hasLockPin(session.user.id);

  return (
    <div>
      <PageHeader
        eyebrow="New entry"
        title="Add a person"
        description="Family, a friend, someone you just met — whatever category fits."
      />
      <PersonForm action={createPerson} submitLabel="Add person" hasPin={pinSet} />
    </div>
  );
}
