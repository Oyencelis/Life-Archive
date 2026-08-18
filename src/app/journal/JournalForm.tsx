"use client";

import { useActionState } from "react";
import { MultiFileUpload, type ExistingFile } from "@/components/media/MultiFileUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";

export interface JournalFormValues {
  title?: string;
  content?: string;
  occurredAt?: string;
  mood?: string;
  visibility?: string;
  placeId?: string;
  personIds?: string[];
  attachments?: ExistingFile[];
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function JournalForm({
  action,
  defaultValues,
  submitLabel,
  places,
  people,
  hasPin,
}: {
  action: FormAction;
  defaultValues?: JournalFormValues;
  submitLabel: string;
  places: { id: string; name: string }[];
  people: { id: string; name: string }[];
  hasPin: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useFormNavigate(state?.href);
  const selectedPeople = new Set(defaultValues?.personIds ?? []);

  return (
    <form action={formAction} className="entity-form" style={{ maxWidth: "62ch" }}>
      <div className="entity-form-row">
        <label>
          Date
          <input name="occurredAt" type="date" defaultValue={defaultValues?.occurredAt} />
        </label>
        <label>
          Mood
          <input name="mood" type="text" defaultValue={defaultValues?.mood} />
        </label>
      </div>

      <label>
        Title (optional)
        <input name="title" type="text" defaultValue={defaultValues?.title} />
      </label>

      <label>
        Entry
        <textarea name="content" rows={12} defaultValue={defaultValues?.content} required />
      </label>

      <div className="entity-form-row">
        <label>
          Visibility
          <select name="visibility" defaultValue={defaultValues?.visibility ?? "PUBLIC"}>
            <option value="PUBLIC">Public</option>
            {/* Only disabled when it isn't already the current value — a
                pre-selected disabled option's submission behavior isn't
                worth relying on when the alternative (silently un-privating
                an entry) is this costly. */}
            <option value="PRIVATE" disabled={!hasPin && defaultValues?.visibility !== "PRIVATE"}>
              Private {hasPin ? "" : "(set a PIN in Settings first)"}
            </option>
          </select>
        </label>
        <label>
          Place
          <select name="placeId" defaultValue={defaultValues?.placeId ?? ""}>
            <option value="">Not set</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <MultiFileUpload
        name="attachmentMediaIds"
        label="Photos & video"
        existing={defaultValues?.attachments}
        accept="image/*,video/*"
        hint="20MB per file. A few photos are fine on the free storage tier — long videos will eat through it fast."
      />

      {people.length > 0 && (
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 8 }}>
            Who was there
          </legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            {people.map((p) => (
              <label
                key={p.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, fontSize: 13.5 }}
              >
                <input
                  type="checkbox"
                  name="personIds"
                  value={p.id}
                  defaultChecked={selectedPeople.has(p.id)}
                  style={{ width: "auto" }}
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state?.error && <p className="setup-error">{state.error}</p>}

      <div className="entity-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
