import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./PrintButton";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "undated";
}

// A single flowing, printable document — the browser's own "Save as PDF"
// covers the PDF requirement without pulling in a rendering dependency
// (puppeteer et al.) just for this. Unlike the JSON/Markdown exports,
// locked entries are omitted rather than included: a printed page is far
// more likely to end up somewhere someone else can see it than a
// downloaded file is.
export default async function PrintExportPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [user, memories, journalEntries, writings, reflections] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.memory.findMany({ where: { userId, archivedAt: null }, orderBy: { date: "asc" } }),
    prisma.journalEntry.findMany({ where: { userId }, orderBy: { occurredAt: "asc" } }),
    prisma.writing.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.reflection.findMany({ where: { userId }, include: { currentVersion: true } }),
  ]);

  return (
    <div className="ed-shell print-doc">
      <style>{`
        .print-doc article { max-width: 68ch; margin: 0 auto; }
        .print-doc h2 { margin-top: 2.5em; border-bottom: 1px solid var(--color-border, #ddd); padding-bottom: 0.3em; }
        .print-doc .entry { margin: 1.4em 0; }
        .print-doc .entry h3 { margin-bottom: 0.2em; }
        .print-doc .entry p { white-space: pre-wrap; line-height: 1.6; }
        @media print {
          .print-hide, .app-nav, .ask-bubble { display: none !important; }
          .print-doc { padding: 0; }
        }
      `}</style>

      <div className="print-hide" style={{ marginBottom: 24 }}>
        <PrintButton />
      </div>

      <article>
        <h1>{user?.name ?? "Life Archive"}</h1>
        <p>Printed {new Date().toISOString().slice(0, 10)}</p>

        {journalEntries.length > 0 && (
          <section>
            <h2>Journal</h2>
            {journalEntries.map((j) => {
              const locked = j.visibility === "PRIVATE";
              return (
                <div className="entry" key={j.id}>
                  <h3>{locked ? "Locked entry" : `${fmtDate(j.occurredAt)}${j.title ? ` — ${j.title}` : ""}`}</h3>
                  <p>{locked ? "[Omitted from the printable view]" : j.content}</p>
                </div>
              );
            })}
          </section>
        )}

        {memories.length > 0 && (
          <section>
            <h2>Memories</h2>
            {memories.map((m) => (
              <div className="entry" key={m.id}>
                <h3>
                  {fmtDate(m.date)} — {m.title}
                </h3>
                {m.description && <p>{m.description}</p>}
              </div>
            ))}
          </section>
        )}

        {writings.length > 0 && (
          <section>
            <h2>Writings</h2>
            {writings.map((w) => {
              const locked = w.visibility === "PRIVATE";
              return (
                <div className="entry" key={w.id}>
                  <h3>{locked ? "Locked writing" : (w.title ?? w.type)}</h3>
                  <p>{locked ? "[Omitted from the printable view]" : w.content}</p>
                </div>
              );
            })}
          </section>
        )}

        {reflections.some((r) => r.currentVersion) && (
          <section>
            <h2>Reflections</h2>
            {reflections
              .filter((r) => r.currentVersion)
              .map((r) => (
                <div className="entry" key={r.id}>
                  <h3>{r.subject}</h3>
                  <p>{r.currentVersion!.content}</p>
                </div>
              ))}
          </section>
        )}
      </article>
    </div>
  );
}
