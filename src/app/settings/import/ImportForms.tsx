"use client";

import { useActionState } from "react";
import { importJournalCsv, importPeopleCsv, type ImportResult } from "../import-actions";

function ImportResultLine({ state }: { state: ImportResult }) {
  if (state.error) return <p className="setup-error">{state.error}</p>;
  if (state.imported === undefined) return null;
  return (
    <p className="record-row-meta">
      Imported {state.imported}{state.skipped ? `, skipped ${state.skipped} row(s) missing required fields` : ""}.
    </p>
  );
}

export function ImportForms() {
  const [journalState, journalAction, journalPending] = useActionState(importJournalCsv, {});
  const [peopleState, peopleAction, peoplePending] = useActionState(importPeopleCsv, {});

  return (
    <div className="record-groups">
      <section className="record-group">
        <h2 className="record-group-label">Journal entries</h2>
        <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: "4px 0 12px" }}>
          Columns: <code>date</code>, <code>title</code>, <code>content</code>, <code>mood</code>. Only{" "}
          <code>content</code> is required.
        </p>
        <form action={journalAction} className="entity-form-row" style={{ alignItems: "center" }}>
          <input type="file" name="file" accept=".csv,text/csv" required />
          <button type="submit" className="btn btn-primary" disabled={journalPending}>
            {journalPending ? "Importing…" : "Import journal CSV"}
          </button>
        </form>
        <ImportResultLine state={journalState} />
      </section>

      <section className="record-group">
        <h2 className="record-group-label">People</h2>
        <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: "4px 0 12px" }}>
          Columns: <code>name</code>, <code>category</code>, <code>relationshipStatus</code>,{" "}
          <code>nickname</code>, <code>bio</code>, <code>notes</code>. Only <code>name</code> is required.
        </p>
        <form action={peopleAction} className="entity-form-row" style={{ alignItems: "center" }}>
          <input type="file" name="file" accept=".csv,text/csv" required />
          <button type="submit" className="btn btn-primary" disabled={peoplePending}>
            {peoplePending ? "Importing…" : "Import people CSV"}
          </button>
        </form>
        <ImportResultLine state={peopleState} />
      </section>
    </div>
  );
}
