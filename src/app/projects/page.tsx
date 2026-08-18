import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { Tabs } from "@/components/shell/Tabs";
import { resolveEntityMediaBatch } from "@/lib/storage/resolve";
import { groupByKey } from "@/lib/group-by";
import { deleteProject } from "./actions";

const STATUS_ORDER = ["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED", "FAILED"];

function statusLabel(status: string) {
  return status[0] + status.slice(1).toLowerCase();
}

type ProjectWithCover = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  coverUrl: string | null;
};

function ProjectCards({ projects }: { projects: ProjectWithCover[] }) {
  return (
    <ul className="record-cards">
      {projects.map((p, i) => (
        <li key={p.id} className="record-card" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/projects/${p.id}`} className="record-card-link">
            <div className="record-card-media">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="" />
              ) : (
                <span className="record-card-media-fallback">{p.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="record-card-body">
              <span className="record-card-title">{p.name}</span>
              <span className="record-card-meta">{p.goal ?? statusLabel(p.status)}</span>
            </div>
          </Link>
          <form action={deleteProject.bind(null, p.id)} className="record-card-delete-form">
            <ConfirmSubmitButton
              label="×"
              ariaLabel={`Delete ${p.name}`}
              className="record-card-delete"
              confirmText={`Remove "${p.name}" from your archive? This can't be undone.`}
            />
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { startDate: "desc" },
    take: 200,
  });

  const covers = await resolveEntityMediaBatch("project", projects.map((p) => p.id), "cover");
  const withCover = projects.map((p) => ({ ...p, coverUrl: covers.get(p.id)?.[0]?.url ?? null }));
  const groups = groupByKey(withCover, (p) => p.status, STATUS_ORDER);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Not a portfolio</p>
          <h1 className="ed-index-heading">Projects</h1>
          <p className="ed-hero-desc">
            School projects, side builds, experiments, and the abandoned ones — kept for what they taught you, not to impress anyone.
          </p>
        </div>
        <Link href="/projects/new" className="ed-cta-primary">
          + New project
        </Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState
          eyebrow="No projects yet"
          title="No history to preserve yet."
          body="Every project here — finished, abandoned, or failed — gets to keep its goal, its problems, and what you learned."
          action={
            <Link href="/projects/new" className="btn btn-primary">
              Add your first project
            </Link>
          }
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Projects by status"
          tabs={[
            { key: "all", label: "All", count: withCover.length, content: <ProjectCards projects={withCover} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: statusLabel(group.key),
              count: group.items.length,
              content: <ProjectCards projects={group.items} />,
            })),
          ]}
        />
      ) : (
        <ProjectCards projects={withCover} />
      )}
    </div>
  );
}
