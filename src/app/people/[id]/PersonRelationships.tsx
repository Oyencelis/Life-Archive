"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { ModalShell } from "@/components/shell/ModalShell";
import { addPersonRelationship, removePersonRelationship } from "../actions";

export interface RelationshipLite {
  id: string;
  relationshipType: string;
  otherPerson: { id: string; name: string };
}

export function PersonRelationships({
  personId,
  personName,
  relationships,
  candidates,
}: {
  personId: string;
  personName: string;
  relationships: RelationshipLite[];
  candidates: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const boundAdd = addPersonRelationship.bind(null, personId);
  const [state, formAction, pending] = useActionState(boundAdd, {});
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && submitted.current && !state?.error) {
      submitted.current = false;
      setOpen(false);
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <div>
      <p style={{ marginBottom: 16 }}>
        Other people {personName} knows — a friend, a sibling, anyone connected through them.
      </p>

      {relationships.length > 0 ? (
        <ul className="record-list" style={{ marginBottom: 16, borderTop: "none" }}>
          {relationships.map((r) => (
            <li key={r.id} className="record-row">
              <Link href={`/people/${r.otherPerson.id}`} className="record-row-title">
                {r.otherPerson.name}
              </Link>
              <div className="record-row-actions">
                <span className="record-row-meta">{r.relationshipType}</span>
                <form action={removePersonRelationship.bind(null, r.id, personId)}>
                  <ConfirmSubmitButton
                    label="Remove"
                    confirmText={`Remove the connection to ${r.otherPerson.name}?`}
                  />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontStyle: "italic", marginBottom: 16 }}>Not connected to anyone yet.</p>
      )}

      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + Add connection
      </button>

      {open && (
        <ModalShell onClose={() => setOpen(false)}>
          <p className="ed-feature-section-label">Connect {personName} to</p>
          {candidates.length > 0 ? (
            <form
              ref={formRef}
              action={formAction}
              onSubmit={() => {
                submitted.current = true;
              }}
              className="entity-form"
            >
              <fieldset
                style={{
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--surface-radius)",
                  padding: 10,
                  margin: "0 0 12px",
                  maxHeight: 260,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <legend style={{ fontSize: 13, padding: "0 4px" }}>Pick one or more people</legend>
                {candidates.map((c) => (
                  <label
                    key={c.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, padding: "4px 2px" }}
                  >
                    <input type="checkbox" name="relatedPersonId" value={c.id} />
                    {c.name}
                  </label>
                ))}
              </fieldset>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, marginBottom: 12 }}>
                As
                <input name="relationshipType" type="text" placeholder="Sibling, best friend…" required autoFocus />
              </label>
              {state?.error && <p className="setup-error">{state.error}</p>}
              <div className="entity-form-actions">
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Connecting…" : "Connect"}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ fontStyle: "italic" }}>
              {personName} is already connected to everyone in your directory. Add a new person first,
              then come back here to connect them.
            </p>
          )}
        </ModalShell>
      )}
    </div>
  );
}
