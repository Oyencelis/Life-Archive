import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { EntityFeature, type FeatureFact } from "@/components/shell/EntityFeature";
import { ReadMore } from "@/components/shell/ReadMore";
import { resolveEntityMedia } from "@/lib/storage/resolve";
import { deleteProject } from "../actions";

function statusLabel(status: string) {
  return status[0] + status.slice(1).toLowerCase();
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } });

  if (!project) notFound();

  const cover = await resolveEntityMedia("project", id, "cover");

  const facts: FeatureFact[] = [{ label: "Status", value: statusLabel(project.status) }];
  if (project.goal) facts.push({ label: "Goal", value: project.goal });
  if (project.startDate || project.endDate) {
    facts.push({
      label: "Timeline",
      value: `${project.startDate ? project.startDate.toISOString().slice(0, 10) : "?"} – ${
        project.endDate ? project.endDate.toISOString().slice(0, 10) : "ongoing"
      }`,
    });
  }
  if (project.websiteUrl) {
    facts.push({
      label: "Website",
      value: (
        <a href={project.websiteUrl} target="_blank" rel="noreferrer">
          Visit ↗
        </a>
      ),
    });
  }

  return (
    <EntityFeature
      eyebrow="Project"
      title={project.name}
      coverUrl={cover[0]?.url}
      tone="paper"
      facts={facts}
      backHref="/projects"
      backLabel="Projects"
      actions={
        <>
          <Link href={`/projects/${project.id}/edit`} className="ed-cta-ghost">
            Edit
          </Link>
          <form action={deleteProject.bind(null, project.id)}>
            <ConfirmSubmitButton
              label="Delete"
              confirmText={`Remove "${project.name}" from your archive? This can't be undone.`}
              className="btn btn-danger"
            />
          </form>
        </>
      }
    >
      {project.description ? (
        <ReadMore>
          <p className="ed-feature-description">{project.description}</p>
        </ReadMore>
      ) : (
        <p className="ed-feature-description ed-feature-description-empty">
          No description written yet.
        </p>
      )}

      {project.whatILearned && (
        <div>
          <p className="ed-feature-section-label">What I learned</p>
          <ReadMore>
            <p className="ed-feature-description">{project.whatILearned}</p>
          </ReadMore>
        </div>
      )}

      {project.whyItEnded && (
        <div>
          <p className="ed-feature-section-label">Why it ended</p>
          <ReadMore>
            <p className="ed-feature-description">{project.whyItEnded}</p>
          </ReadMore>
        </div>
      )}
    </EntityFeature>
  );
}
