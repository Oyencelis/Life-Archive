"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { createInterest } from "./actions";

export function AddInterestForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInterest, {});
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
        + New interest
      </button>
    );
  }

  return (
    <ModalShell onClose={() => setOpen(false)}>
      <PageHeader eyebrow="New entry" title="Add an interest" description="Games, music, books, hobbies." />
      <form
        ref={formRef}
        action={formAction}
        onSubmit={() => {
          submitted.current = true;
        }}
        className="entity-form"
      >
        <div className="entity-form-row">
          <label>
            Name
            <input name="name" type="text" required autoFocus />
          </label>
          <label>
            Category
            <input name="category" type="text" placeholder="Games, music…" />
          </label>
        </div>
        <label>
          Status
          <select name="status" defaultValue="CURRENT">
            <option value="CURRENT">Current</option>
            <option value="PAST">Past</option>
          </select>
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "Add interest"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
