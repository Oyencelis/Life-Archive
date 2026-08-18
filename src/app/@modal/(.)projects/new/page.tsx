import { Modal } from "@/components/shell/Modal";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProjectForm } from "@/app/projects/ProjectForm";
import { createProject } from "@/app/projects/actions";

export default function NewProjectModal() {
  return (
    <Modal>
      <PageHeader
        eyebrow="New entry"
        title="Add a project"
        description="Finished, abandoned, or still going — it all gets to keep its history."
      />
      <ProjectForm action={createProject} submitLabel="Add project" />
    </Modal>
  );
}
