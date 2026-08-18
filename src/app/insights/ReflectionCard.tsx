"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { addReflectionVersion, deleteReflection } from "./actions";

export interface ReflectionData {
  id: string;
  subject: string;
  content: string;
  authorAge: number | null;
  writtenAt: string;
  versionCount: number;
}

export function ReflectionCard({ reflection, index }: { reflection: ReflectionData; index: number }) {
  const [revising, setRevising] = useState(false);
  const boundAdd = addReflectionVersion.bind(null, reflection.id);
  const [state, formAction, pending] = useActionState(boundAdd, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      setRevising(false);
    }
  }, [pending, state]);

  return (
    <li className="record-row reflection-card" style={{ "--i": index } as React.CSSProperties}>
      <div style={{ width: "100%" }}>
        <div className="section-toolbar" style={{ marginBottom: 8 }}>
          <div>
            <span className="record-row-title">{reflection.subject}</span>
            <span className="record-row-meta" style={{ marginLeft: 10 }}>
              {reflection.authorAge ? `age ${reflection.authorAge} · ` : ""}
              {reflection.writtenAt}
              {reflection.versionCount > 1 ? ` · ${reflection.versionCount} versions` : ""}
            </span>
          </div>
          <div className="record-row-actions">
            {reflection.versionCount > 1 && (
              <Link href={`/insights/${reflection.id}`} className="btn-ghost">
                History
              </Link>
            )}
            <button type="button" className="btn-ghost" onClick={() => setRevising((v) => !v)}>
              {revising ? "Cancel" : "Revise"}
            </button>
            <form action={deleteReflection.bind(null, reflection.id)}>
              <ConfirmSubmitButton
                label="Delete"
                confirmText={`Delete "${reflection.subject}" and all of its versions? This can't be undone.`}
              />
            </form>
          </div>
        </div>

        {!revising ? (
          <p style={{ margin: 0 }}>{reflection.content}</p>
        ) : (
          <form
            action={formAction}
            onSubmit={() => {
              submitted.current = true;
            }}
            className="entity-form"
          >
            <label>
              Age now (optional)
              <input name="authorAge" type="number" min={0} max={130} style={{ maxWidth: 120 }} />
            </label>
            <label>
              New version
              <textarea name="content" rows={4} defaultValue={reflection.content} required />
            </label>
            {state?.error && <p className="setup-error">{state.error}</p>}
            <div className="entity-form-actions">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Saving…" : "Save new version"}
              </button>
            </div>
          </form>
        )}
      </div>
    </li>
  );
}
