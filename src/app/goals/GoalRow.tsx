"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { updateGoal, deleteGoal, addGoalCheckIn } from "./actions";

export interface GoalCheckInData {
  id: string;
  progress: number;
  note: string | null;
  createdAt: string;
}

export interface GoalData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  targetDate: string | null;
  progress: number | null;
  reflection: string | null;
  checkIns: GoalCheckInData[];
}

function CheckInLog({ goal }: { goal: GoalData }) {
  const [open, setOpen] = useState(false);
  const boundCheckIn = addGoalCheckIn.bind(null, goal.id);
  const [state, formAction, pending] = useActionState(boundCheckIn, {});
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <div style={{ marginTop: 6 }}>
      <button type="button" className="btn-ghost" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide history" : `History (${goal.checkIns.length})`}
      </button>
      {open && (
        <div style={{ marginTop: 8, paddingLeft: 4, borderLeft: "2px solid var(--color-border, #ddd)" }}>
          {goal.checkIns.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: "0 0 8px 8px" }}>
              No check-ins logged yet — progress trails only start once you log one.
            </p>
          ) : (
            <ul style={{ margin: "0 0 8px 8px", padding: 0, listStyle: "none", fontSize: 13 }}>
              {goal.checkIns.map((c) => (
                <li key={c.id} style={{ margin: "4px 0" }}>
                  <strong>{c.progress}%</strong> — {c.createdAt}
                  {c.note ? ` — ${c.note}` : ""}
                </li>
              ))}
            </ul>
          )}
          <form
            ref={formRef}
            action={formAction}
            onSubmit={() => {
              submitted.current = true;
            }}
            className="entity-form-row"
            style={{ marginLeft: 8, alignItems: "center" }}
          >
            <input name="progress" type="number" min={0} max={100} placeholder="%" style={{ width: 70 }} required />
            <input name="note" type="text" placeholder="Note (optional)" style={{ flex: 1 }} />
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Logging…" : "Log check-in"}
            </button>
          </form>
          {state?.error && <p className="setup-error">{state.error}</p>}
        </div>
      )}
    </div>
  );
}

export function GoalRow({ goal, index }: { goal: GoalData; index: number }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateGoal.bind(null, goal.id);
  const [state, formAction, pending] = useActionState(boundUpdate, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      setEditing(false);
    }
  }, [pending, state]);

  if (!editing) {
    return (
      <li className="record-row" style={{ "--i": index } as React.CSSProperties}>
        <div>
          <span className="record-row-title">{goal.title}</span>
          <CheckInLog goal={goal} />
        </div>
        <div className="record-row-actions">
          <span className="record-row-meta">
            {goal.status}
            {goal.progress ? ` · ${goal.progress}%` : ""}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={deleteGoal.bind(null, goal.id)}>
            <ConfirmSubmitButton label="Delete" confirmText={`Remove "${goal.title}"?`} />
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="record-row record-row-editing">
      <form
        action={formAction}
        onSubmit={() => {
          submitted.current = true;
        }}
        className="entity-form"
        style={{ width: "100%" }}
      >
        <label>
          Title
          <input name="title" type="text" defaultValue={goal.title} required />
        </label>
        <div className="entity-form-row">
          <label>
            Status
            <select name="status" defaultValue={goal.status}>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
              <option value="ABANDONED">Abandoned</option>
              <option value="REPLACED">Replaced</option>
            </select>
          </label>
          <label>
            Progress %
            <input name="progress" type="number" min={0} max={100} defaultValue={goal.progress ?? 0} />
          </label>
        </div>
        <label>
          Target date
          <input name="targetDate" type="date" defaultValue={goal.targetDate ?? ""} />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} defaultValue={goal.description ?? ""} />
        </label>
        <label>
          Reflection
          <textarea name="reflection" rows={2} defaultValue={goal.reflection ?? ""} />
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
