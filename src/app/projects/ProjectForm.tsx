"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/media/ImageUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";

const STATUS_OPTIONS = ["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED", "FAILED"] as const;

function labelFor(s: string) {
  return s[0] + s.slice(1).toLowerCase();
}

export interface ProjectFormValues {
  name?: string;
  description?: string;
  goal?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  whatILearned?: string;
  whyItEnded?: string;
  websiteUrl?: string;
  coverMediaId?: string;
  coverUrl?: string;
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function ProjectForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: FormAction;
  defaultValues?: ProjectFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useFormNavigate(state?.href);

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
        Goal
        <input name="goal" type="text" defaultValue={defaultValues?.goal} />
      </label>

      <label>
        Website
        <input
          name="websiteUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaultValues?.websiteUrl}
        />
      </label>

      <div className="entity-form-row">
        <label>
          Status
          <select name="status" defaultValue={defaultValues?.status ?? "ACTIVE"}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {labelFor(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Started
          <input name="startDate" type="date" defaultValue={defaultValues?.startDate} />
        </label>
      </div>

      <label>
        Ended
        <input name="endDate" type="date" defaultValue={defaultValues?.endDate} />
      </label>

      <label>
        Description
        <textarea name="description" rows={4} defaultValue={defaultValues?.description} />
      </label>

      <label>
        What I learned
        <textarea name="whatILearned" rows={3} defaultValue={defaultValues?.whatILearned} />
      </label>

      <label>
        Why it ended
        <textarea name="whyItEnded" rows={3} defaultValue={defaultValues?.whyItEnded} />
      </label>

      {state?.error && <p className="setup-error">{state.error}</p>}

      <div className="entity-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
