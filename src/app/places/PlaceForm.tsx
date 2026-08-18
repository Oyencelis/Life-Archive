"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/media/ImageUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";
import { PlaceLocationPicker } from "./PlaceLocationPicker";

export interface PlaceFormValues {
  name?: string;
  category?: string;
  description?: string;
  lat?: string;
  lng?: string;
  personIds?: string[];
  coverMediaId?: string;
  coverUrl?: string;
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function PlaceForm({
  action,
  defaultValues,
  submitLabel,
  people,
}: {
  action: FormAction;
  defaultValues?: PlaceFormValues;
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
        Name
        <input name="name" type="text" defaultValue={defaultValues?.name} required />
      </label>
      <label>
        Category
        <input
          name="category"
          type="text"
          list="place-categories"
          defaultValue={defaultValues?.category}
        />
        <datalist id="place-categories">
          <option value="Home" />
          <option value="School" />
          <option value="Workplace" />
          <option value="City" />
          <option value="Travel" />
          <option value="Restaurant" />
        </datalist>
      </label>
      <label>
        Description
        <textarea name="description" rows={3} defaultValue={defaultValues?.description} />
      </label>
      <PlaceLocationPicker defaultLat={defaultValues?.lat} defaultLng={defaultValues?.lng} />

      {people.length > 0 && (
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 8 }}>
            Who connects here
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
