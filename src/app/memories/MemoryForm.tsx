"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/media/ImageUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";

export interface MemoryFormValues {
  title?: string;
  description?: string;
  date?: string;
  datePrecision?: string;
  mood?: string;
  importance?: string;
  personIds?: string[];
  tags?: string;
  coverMediaId?: string;
  coverUrl?: string;
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function MemoryForm({
  action,
  defaultValues,
  submitLabel,
  people,
}: {
  action: FormAction;
  defaultValues?: MemoryFormValues;
  submitLabel: string;
  people: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useFormNavigate(state?.href);
  const selectedPeople = new Set(defaultValues?.personIds ?? []);

  return (
    <form action={formAction} className="entity-form">
      <ImageUpload
        name="coverMediaId"
        label="Photo"
        existingId={defaultValues?.coverMediaId}
        existingUrl={defaultValues?.coverUrl}
      />

      <label>
        Title
        <input name="title" type="text" defaultValue={defaultValues?.title} required />
      </label>

      <div className="entity-form-row">
        <label>
          Date
          <input name="date" type="date" defaultValue={defaultValues?.date} />
        </label>
        <label>
          How precise
          <select name="datePrecision" defaultValue={defaultValues?.datePrecision ?? "EXACT"}>
            <option value="EXACT">Exact</option>
            <option value="APPROXIMATE">Approximate</option>
            <option value="ERA_ONLY">Era only</option>
          </select>
        </label>
      </div>

      <div className="entity-form-row">
        <label>
          Mood
          <input name="mood" type="text" defaultValue={defaultValues?.mood} />
        </label>
        <label>
          Importance
          <select name="importance" defaultValue={defaultValues?.importance ?? "3"}>
            <option value="1">1 — minor</option>
            <option value="2">2</option>
            <option value="3">3 — notable</option>
            <option value="4">4</option>
            <option value="5">5 — defining</option>
          </select>
        </label>
      </div>

      <label>
        Description
        <textarea name="description" rows={5} defaultValue={defaultValues?.description} />
      </label>

      <label>
        Tags
        <input
          name="tags"
          type="text"
          placeholder="comma, separated, tags"
          defaultValue={defaultValues?.tags}
        />
      </label>

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
