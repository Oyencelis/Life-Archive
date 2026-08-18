"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { createWriting } from "./actions";

export function AddWritingForm({ hasPin }: { hasPin: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createWriting, {});
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
        + New writing
      </button>
    );
  }

  return (
    <ModalShell onClose={() => setOpen(false)}>
      <PageHeader eyebrow="New entry" title="Add a writing" description="Essays, quotes, poems, letters." />
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
            Title
            <input name="title" type="text" autoFocus />
          </label>
          <label>
            Type
            <select name="type" defaultValue="THOUGHT">
              <option value="ESSAY">Essay</option>
              <option value="QUOTE">Quote</option>
              <option value="POEM">Poem</option>
              <option value="LETTER">Letter</option>
              <option value="UNSENT">Unsent</option>
              <option value="STORY">Story</option>
              <option value="THOUGHT">Thought</option>
            </select>
          </label>
        </div>
        <label>
          Content
          <textarea name="content" rows={6} required />
        </label>
        <label>
          Visibility
          <select name="visibility" defaultValue="PUBLIC">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE" disabled={!hasPin}>
              Private {hasPin ? "" : "(set a PIN in Settings first)"}
            </option>
          </select>
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "Add writing"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
