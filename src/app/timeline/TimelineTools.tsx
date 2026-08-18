"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { createEra, createMilestone } from "./actions";

interface EraLite {
  id: string;
  name: string;
}

export function TimelineTools({
  eras,
  triggerClassName,
}: {
  eras: EraLite[];
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [eraState, eraAction, eraPending] = useActionState(createEra, {});
  const [milestoneState, milestoneAction, milestonePending] = useActionState(
    createMilestone,
    {}
  );
  const eraSubmitted = useRef(false);
  const milestoneSubmitted = useRef(false);
  const eraFormRef = useRef<HTMLFormElement>(null);
  const milestoneFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!eraPending && eraSubmitted.current && !eraState?.error) {
      eraSubmitted.current = false;
      eraFormRef.current?.reset();
    }
  }, [eraPending, eraState]);

  useEffect(() => {
    if (!milestonePending && milestoneSubmitted.current && !milestoneState?.error) {
      milestoneSubmitted.current = false;
      milestoneFormRef.current?.reset();
    }
  }, [milestonePending, milestoneState]);

  return (
    <>
      <button type="button" className={triggerClassName ?? "btn"} onClick={() => setOpen(true)}>
        + New era or milestone
      </button>

      {open && (
        <ModalShell onClose={() => setOpen(false)}>
          <PageHeader
            eyebrow="Chronology"
            title="Add era or milestone"
            description="The building blocks your timeline groups itself around."
          />

          <p className="page-header-eyebrow" style={{ marginTop: 8 }}>
            Era
          </p>
          <form
            ref={eraFormRef}
            action={eraAction}
            onSubmit={() => {
              eraSubmitted.current = true;
            }}
            className="entity-form"
            style={{ marginBottom: 32 }}
          >
            <label>
              Name
              <input name="name" type="text" placeholder="Thesis era" required />
            </label>
            <div className="entity-form-row">
              <label>
                Starts
                <input name="startDate" type="date" />
              </label>
              <label>
                Ends
                <input name="endDate" type="date" />
              </label>
            </div>
            {eraState?.error && <p className="setup-error">{eraState.error}</p>}
            <div className="entity-form-actions">
              <button type="submit" className="btn btn-primary" disabled={eraPending}>
                {eraPending ? "Adding…" : "Add era"}
              </button>
            </div>
          </form>

          <p className="page-header-eyebrow">Milestone</p>
          <form
            ref={milestoneFormRef}
            action={milestoneAction}
            onSubmit={() => {
              milestoneSubmitted.current = true;
            }}
            className="entity-form"
          >
            <label>
              Title
              <input name="headline" type="text" placeholder="Moved to college" required />
            </label>
            <label>
              Date
              <input name="date" type="date" required />
            </label>
            <label>
              Era
              <select name="eraId" defaultValue="">
                <option value="">Match by date</option>
                {eras.map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.name}
                  </option>
                ))}
              </select>
            </label>
            {milestoneState?.error && <p className="setup-error">{milestoneState.error}</p>}
            <div className="entity-form-actions">
              <button type="submit" className="btn btn-primary" disabled={milestonePending}>
                {milestonePending ? "Adding…" : "Add milestone"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}
