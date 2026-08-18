import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tabs } from "@/components/shell/Tabs";
import { groupByKey } from "@/lib/group-by";
import { AddGoalForm } from "./AddGoalForm";
import { GoalRow } from "./GoalRow";

const STATUS_ORDER = ["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED", "REPLACED"];

function statusLabel(status: string) {
  return status[0] + status.slice(1).toLowerCase();
}

type GoalLite = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  targetDate: Date | null;
  progress: number | null;
  reflection: string | null;
  checkIns: { id: string; progress: number; note: string | null; createdAt: Date }[];
};

function GoalRows({ goals }: { goals: GoalLite[] }) {
  return (
    <ul className="record-list">
      {goals.map((goal, i) => (
        <GoalRow
          key={goal.id}
          index={i}
          goal={{
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            status: goal.status,
            targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
            progress: goal.progress,
            reflection: goal.reflection,
            checkIns: goal.checkIns.map((c) => ({
              id: c.id,
              progress: c.progress,
              note: c.note,
              createdAt: c.createdAt.toISOString().slice(0, 10),
            })),
          }}
        />
      ))}
    </ul>
  );
}

export default async function GoalsPage() {
  const session = await requireSession();
  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { checkIns: { orderBy: { createdAt: "desc" } } },
  });

  const groups = groupByKey(goals, (g) => g.status, STATUS_ORDER);

  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Where you&apos;re headed</p>
          <h1 className="ed-index-heading">Goals</h1>
          <p className="ed-hero-desc">
            Active, completed, paused, or abandoned — nothing here gets deleted just for not working out.
          </p>
        </div>
        <AddGoalForm />
      </div>
      {goals.length === 0 ? (
        <EmptyState
          eyebrow="No goals yet"
          title="Nothing set."
          body="Abandoned goals stay on record — they're part of the history, not a failure to hide."
        />
      ) : groups.length > 1 ? (
        <Tabs
          ariaLabel="Goals by status"
          tabs={[
            { key: "all", label: "All", count: goals.length, content: <GoalRows goals={goals} /> },
            ...groups.map((group) => ({
              key: group.key,
              label: statusLabel(group.key),
              count: group.items.length,
              content: <GoalRows goals={group.items} />,
            })),
          ]}
        />
      ) : (
        <GoalRows goals={goals} />
      )}
    </div>
  );
}
