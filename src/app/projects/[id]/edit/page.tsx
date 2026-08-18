import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shell/PageHeader";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { ProjectForm } from "../../ProjectForm";
import { updateProject } from "../../actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [project, cover] = await Promise.all([
    prisma.project.findFirst({ where: { id, userId: session.user.id } }),
    resolveEntityMedia("project", id, "cover"),
  ]);

  if (!project) notFound();

  return (
    <div>
      <PageHeader eyebrow="Editing" title={project.name} description="Update this project." />
      <ProjectForm
        action={updateProject.bind(null, id)}
        submitLabel="Save changes"
        defaultValues={{
          name: project.name,
          description: project.description ?? undefined,
          goal: project.goal ?? undefined,
          status: project.status,
          startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : undefined,
          endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : undefined,
          whatILearned: project.whatILearned ?? undefined,
          whyItEnded: project.whyItEnded ?? undefined,
          websiteUrl: project.websiteUrl ?? undefined,
          coverMediaId: cover[0]?.id,
          coverUrl: cover[0]?.url,
        }}
      />
    </div>
  );
}
