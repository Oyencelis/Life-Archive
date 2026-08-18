"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { createGoal } from "./actions";

export function AddGoalForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGoal, {});
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      setOpen(false);
      formRef.current?.reset();
    }
  }, [pending, state]);

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        + New goal
      </button>
    );
  }

  return (
    <ModalShell onClose={() => setOpen(false)}>
      <PageHeader eyebrow="New entry" title="Add a goal" description="Where you're headed." />
      <form
        ref={formRef}
        action={formAction}
        onSubmit={() => {
          submitted.current = true;
        }}
        className="entity-form"
      >
        <label>
          Title
          <input name="title" type="text" required autoFocus />
        </label>
        <div className="entity-form-row">
          <label>
            Category
            <input name="category" type="text" placeholder="Health, career…" />
          </label>
          <label>
            Target date
            <input name="targetDate" type="date" />
          </label>
        </div>
        <label>
          Description
          <textarea name="description" rows={3} />
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "Add goal"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
