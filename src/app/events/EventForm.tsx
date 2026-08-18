"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/media/ImageUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";

const CATEGORY_OPTIONS = [
  "BIRTHDAY",
  "GRADUATION",
  "TRIP",
  "SCHOOL",
  "FAMILY",
  "MILESTONE",
  "FIRST_MEETING",
  "ANNIVERSARY",
  "OTHER",
] as const;

function labelFor(cat: string) {
  return cat
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export interface EventFormValues {
  title?: string;
  description?: string;
  date?: string;
  category?: string;
  placeId?: string;
  eraId?: string;
  personIds?: string[];
  coverMediaId?: string;
  coverUrl?: string;
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function EventForm({
  action,
  defaultValues,
  submitLabel,
  places,
  eras,
  people,
}: {
  action: FormAction;
  defaultValues?: EventFormValues;
  submitLabel: string;
  places: { id: string; name: string }[];
  eras: { id: string; name: string }[];
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
          Category
          <select name="category" defaultValue={defaultValues?.category ?? "OTHER"}>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {labelFor(cat)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="entity-form-row">
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
        <label>
          Era
          <select name="eraId" defaultValue={defaultValues?.eraId ?? ""}>
            <option value="">Match by date</option>
            {eras.map((era) => (
              <option key={era.id} value={era.id}>
                {era.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea name="description" rows={4} defaultValue={defaultValues?.description} />
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
