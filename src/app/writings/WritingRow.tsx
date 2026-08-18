"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { UnlockGate } from "@/components/shell/UnlockGate";
import { updateWriting, deleteWriting } from "./actions";

export interface WritingData {
  id: string;
  title: string | null;
  content: string;
  type: string;
  writtenAt: string | null;
  isLocked: boolean;
}

const TYPE_OPTIONS = ["ESSAY", "QUOTE", "POEM", "LETTER", "UNSENT", "STORY", "THOUGHT"] as const;

export function WritingRow({
  writing,
  index,
  unlocked,
  hasPin,
}: {
  writing: WritingData;
  index: number;
  unlocked: boolean;
  hasPin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const boundUpdate = updateWriting.bind(null, writing.id);
  const [state, formAction, pending] = useActionState(boundUpdate, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      setEditing(false);
    }
  }, [pending, state]);

  const hidden = writing.isLocked && !unlocked;

  if (!editing) {
    return (
      <li className="record-row" style={{ "--i": index } as React.CSSProperties}>
        <div>
          <span className="record-row-title">
            {writing.isLocked ? "🔒 " : ""}
            {writing.title ?? writing.type}
          </span>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            {hidden
              ? "Locked."
              : writing.content.length > 120
                ? `${writing.content.slice(0, 120)}…`
                : writing.content}
          </p>
        </div>
        <div className="record-row-actions">
          <span className="record-row-meta">{writing.type}</span>
          {hidden ? (
            <button type="button" className="btn-ghost" onClick={() => setShowUnlock(true)}>
              Unlock
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          <form action={deleteWriting.bind(null, writing.id)}>
            <ConfirmSubmitButton label="Delete" confirmText="Remove this writing?" />
          </form>
        </div>
        {showUnlock && (
          <UnlockGate
            description="This writing is locked. Enter your PIN to read it."
            onClose={() => setShowUnlock(false)}
          />
        )}
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
            Title
            <input name="title" type="text" defaultValue={writing.title ?? ""} />
          </label>
          <label>
            Type
            <select name="type" defaultValue={writing.type}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t[0] + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Content
          <textarea name="content" rows={6} defaultValue={writing.content} required />
        </label>
        <label>
          Visibility
          <select name="visibility" defaultValue={writing.isLocked ? "PRIVATE" : "PUBLIC"}>
            <option value="PUBLIC">Public</option>
            {/* Only disabled when it isn't already the current value — see
                the same note in JournalForm.tsx. */}
            <option value="PRIVATE" disabled={!hasPin && !writing.isLocked}>
              Private {hasPin ? "" : "(set a PIN in Settings first)"}
            </option>
          </select>
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
