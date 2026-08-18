import type { RetrievedRecord } from "./retrieval";
import type { GroundedContext } from "./types";

const TYPE_LABEL: Record<string, string> = {
  person: "Person",
  memory: "Memory",
  journal: "Journal entry",
  place: "Place",
  event: "Event",
  project: "Project",
  writing: "Writing",
  goal: "Goal",
  interest: "Interest",
};

// Builds the bounded, cited text block the model is allowed to answer from.
// Every line carries its record id/type so the answer's citations always
// trace back to something the UI can link to.
export function buildContext(records: RetrievedRecord[]): GroundedContext {
  if (records.length === 0) {
    return { text: "", records: [] };
  }

  const lines = records.map((r, i) => {
    const label = TYPE_LABEL[r.type] ?? r.type;
    return `[${i + 1}] (${label}) ${r.label} — ${r.snippet || "no further detail recorded"}`;
  });

  return {
    text: lines.join("\n"),
    records: records.map((r) => ({ type: r.type, id: r.id, label: r.label, href: r.href })),
  };
}
