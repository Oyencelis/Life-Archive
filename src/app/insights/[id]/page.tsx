import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function ReflectionHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const reflection = await prisma.reflection.findFirst({
    where: { id, userId: session.user.id },
    include: { versions: { orderBy: { writtenAt: "asc" } } },
  });

  if (!reflection) notFound();

  return (
    <div>
      <p className="page-header-eyebrow">Reflection history</p>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>{reflection.subject}</h1>

      <div className="timeline-spine">
        {reflection.versions.map((v, i) => {
          const isCurrent = v.id === reflection.currentVersionId;
          return (
            <div key={v.id} className="timeline-era" style={{ "--i": i } as React.CSSProperties}>
              <h2 className="timeline-era-label" style={{ fontSize: 15 }}>
                {v.authorAge ? `Age ${v.authorAge}` : "Undated"} · {v.writtenAt.toISOString().slice(0, 10)}
                {isCurrent && <span className="badge-current"> · current</span>}
              </h2>
              <p style={{ maxWidth: "62ch", marginBottom: 8 }}>{v.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
