import { PageHeader } from "@/components/shell/PageHeader";
import { ProjectForm } from "../ProjectForm";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader
        eyebrow="New entry"
        title="Add a project"
        description="Finished, abandoned, or still going — it all gets to keep its history."
      />
      <ProjectForm action={createProject} submitLabel="Add project" />
    </div>
  );
}
