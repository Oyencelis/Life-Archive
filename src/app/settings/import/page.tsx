import { requireSession } from "@/lib/require-session";
import { PageHeader } from "@/components/shell/PageHeader";
import { ImportForms } from "./ImportForms";

export default async function ImportPage() {
  await requireSession();

  return (
    <div className="ed-shell">
      <PageHeader
        eyebrow="Bring your history in"
        title="Import"
        description="Bulk-add journal entries or people from a CSV file. Everything else still goes in one at a time — this covers the two record types worth batching."
      />
      <ImportForms />
    </div>
  );
}
