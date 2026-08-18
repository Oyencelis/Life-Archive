"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { createReflection } from "./actions";

export function AddReflectionForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createReflection, {});
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
        + New reflection
      </button>
    );
  }

  return (
    <ModalShell onClose={() => setOpen(false)}>
      <PageHeader
        eyebrow="New entry"
        title="Add a reflection"
        description="What you believe right now — future you can revise it without erasing this."
      />
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
            Subject
            <input name="subject" type="text" placeholder="Who I want to be" required autoFocus />
          </label>
          <label>
            Age now
            <input name="authorAge" type="number" min={0} max={130} />
          </label>
        </div>
        <label>
          What you believe right now
          <textarea name="content" rows={5} required />
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save reflection"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
