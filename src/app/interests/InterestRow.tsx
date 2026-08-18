"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { updateInterest, deleteInterest } from "./actions";

export interface InterestData {
  id: string;
  name: string;
  category: string | null;
  status: string;
  firstDiscovered: string | null;
  lastActive: string | null;
}

export function InterestRow({ interest, index }: { interest: InterestData; index: number }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateInterest.bind(null, interest.id);
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
        <span className="record-row-title">{interest.name}</span>
        <div className="record-row-actions">
          <span className="record-row-meta">
            {interest.status}
            {interest.category ? ` · ${interest.category}` : ""}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={deleteInterest.bind(null, interest.id)}>
            <ConfirmSubmitButton label="Delete" confirmText={`Remove "${interest.name}"?`} />
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
        <div className="entity-form-row">
          <label>
            Name
            <input name="name" type="text" defaultValue={interest.name} required />
          </label>
          <label>
            Category
            <input name="category" type="text" defaultValue={interest.category ?? ""} />
          </label>
        </div>
        <div className="entity-form-row">
          <label>
            Status
            <select name="status" defaultValue={interest.status}>
              <option value="CURRENT">Current</option>
              <option value="PAST">Past</option>
            </select>
          </label>
          <label>
            First discovered
            <input name="firstDiscovered" type="date" defaultValue={interest.firstDiscovered ?? ""} />
          </label>
        </div>
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
